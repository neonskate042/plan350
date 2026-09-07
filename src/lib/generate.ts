// Оркестрация генерации: анкета → промпт → ChadGPT (доступ к Claude) → PDF/Excel → письмо.
// Вызывается из вебхука ЮKassa после успешной оплаты.
//
// Почему ChadGPT, а не прямой Anthropic API: с российских карт нельзя
// пополнить баланс в console.anthropic.com напрямую (решение от 2026-09-06,
// см. plans/zapusk-chek-list.md). ChadGPT — российский сервис, оплата рублями,
// у владельца уже есть оплаченный аккаунт. API совместим с форматом OpenAI
// (chat/completions + tools) — https://ask.chadgpt.ru/api/v1/chat/completions.

import https from "https";
import { prisma } from "@/lib/prisma";
import { getRegion } from "@/lib/regions";
import { buildPrompt, type EquipmentItem } from "@/lib/plan-template";
import { buildBusinessPlanPdf, type BusinessPlanInput } from "@/pdf/business-plan-pdf";
import { buildSmetaExcel } from "@/lib/excel";
import { getTariff } from "@/lib/products";
import { sendPlanReadyEmail, sendGenerationFailedEmail } from "@/lib/mail";

// Схема того, что должен вернуть ИИ. Числа/суммы сметы сюда НЕ входят —
// они берутся из анкеты дословно (см. lib/plan-template.ts, правило источника
// цифр сметы). ИИ отвечает только за текст и финансовый прогноз.
const PLAN_TOOL = {
  name: "submit_business_plan",
  description: "Заполненные разделы бизнес-плана для социального контракта.",
  input_schema: {
    type: "object" as const,
    properties: {
      title: { type: "string", description: "Короткое название дела, 2–5 слов, для титульного листа" },
      summary: { type: "string" },
      applicantInfo: { type: "string" },
      serviceDescription: { type: "string" },
      marketAnalysis: { type: "string" },
      orgPlan: {
        type: "array",
        items: {
          type: "object",
          properties: {
            step: { type: "string" },
            timeframe: { type: "string" },
          },
          required: ["step", "timeframe"],
        },
      },
      finance: {
        type: "array",
        description: "Ровно 12 месяцев",
        items: {
          type: "object",
          properties: {
            month: { type: "string" },
            orders: { type: "integer" },
            revenue: { type: "integer" },
            costs: { type: "integer" },
            profit: { type: "integer" },
          },
          required: ["month", "orders", "revenue", "costs", "profit"],
        },
      },
      breakeven: { type: "string" },
      risks: {
        type: "array",
        items: {
          type: "object",
          properties: {
            risk: { type: "string" },
            probability: { type: "string" },
            measure: { type: "string" },
          },
          required: ["risk", "probability", "measure"],
        },
      },
      swot: {
        type: "object",
        properties: {
          strengths: { type: "array", items: { type: "string" } },
          weaknesses: { type: "array", items: { type: "string" } },
          opportunities: { type: "array", items: { type: "string" } },
          threats: { type: "array", items: { type: "string" } },
        },
        required: ["strengths", "weaknesses", "opportunities", "threats"],
      },
    },
    required: [
      "title",
      "summary",
      "applicantInfo",
      "serviceDescription",
      "marketAnalysis",
      "orgPlan",
      "finance",
      "breakeven",
      "risks",
      "swot",
    ],
  },
};

type AiPlanContent = {
  title: string;
  summary: string;
  applicantInfo: string;
  serviceDescription: string;
  marketAnalysis: string;
  orgPlan: { step: string; timeframe: string }[];
  finance: { month: string; orders: number; revenue: number; costs: number; profit: number }[];
  breakeven: string;
  risks: { risk: string; probability: string; measure: string }[];
  swot: { strengths: string[]; weaknesses: string[]; opportunities: string[]; threats: string[] };
};

// Низкоуровневый POST через https вместо fetch(): у fetch() в Node (undici)
// на этом эндпоинте стабильно воспроизводится обрыв соединения "other side
// closed" на большом теле запроса (проверено 2026-09-07 — curl тем же телом
// проходит без проблем, значит дело не в сервере и не в размере запроса, а
// именно в реализации undici). https.request работает надёжно.
function postJson(url: string, headers: Record<string, string>, body: unknown): Promise<{
  status: number;
  json: () => unknown;
  text: string;
}> {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(body);
    const u = new URL(url);
    const req = https.request(
      {
        hostname: u.hostname,
        path: u.pathname + u.search,
        method: "POST",
        headers: {
          ...headers,
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(payload),
        },
      },
      (res) => {
        const chunks: Buffer[] = [];
        res.on("data", (c) => chunks.push(c));
        res.on("end", () => {
          const text = Buffer.concat(chunks).toString("utf8");
          resolve({
            status: res.statusCode || 0,
            text,
            json: () => JSON.parse(text),
          });
        });
      },
    );
    req.on("error", reject);
    req.write(payload);
    req.end();
  });
}

// export — нужно dev-tools/test-generate.mts для прогона без базы данных.
export async function callAi(prompt: string): Promise<AiPlanContent> {
  const apiKey = process.env.CHADGPT_API_KEY;
  if (!apiKey) {
    throw new Error("CHADGPT_API_KEY не задан — генерация недоступна");
  }
  // Подтверждено документацией ChadGPT (support.chadgpt.ru, раздел API → Текстовые
  // модели, 2026-09-06) — таблица моделей для этого эндпоинта содержит "claude-5-sonnet".
  const model = process.env.CHADGPT_MODEL || "claude-5-sonnet";

  const res = await postJson(
    "https://ask.chadgpt.ru/api/v1/chat/completions",
    { Authorization: `Bearer ${apiKey}` },
    {
      model,
      messages: [{ role: "user", content: prompt }],
      tools: [
        {
          type: "function",
          function: {
            name: PLAN_TOOL.name,
            description: PLAN_TOOL.description,
            parameters: PLAN_TOOL.input_schema,
          },
        },
      ],
      tool_choice: { type: "function", function: { name: PLAN_TOOL.name } },
    },
  );

  if (res.status < 200 || res.status >= 300) {
    throw new Error(`ChadGPT ${res.status}: ${res.text.slice(0, 400)}`);
  }

  const data = res.json() as {
    choices?: { message?: { tool_calls?: { function?: { arguments?: string } }[] } }[];
  };
  const toolCall = data?.choices?.[0]?.message?.tool_calls?.[0];
  if (!toolCall?.function?.arguments) {
    throw new Error("ИИ не вернул структурированный ответ");
  }
  return JSON.parse(toolCall.function.arguments) as AiPlanContent;
}

export async function generateOrder(orderId: string): Promise<void> {
  const order = await prisma.order.findUniqueOrThrow({ where: { id: orderId } });

  try {
    await prisma.order.update({ where: { id: orderId }, data: { status: "generating" } });

    const region = getRegion(order.regionKey);
    if (!region) throw new Error(`Регион не найден или не проверен: ${order.regionKey}`);

    const equipment = order.equipment as unknown as EquipmentItem[];
    const prompt = buildPrompt({
      region,
      activity: order.activity,
      requestedSum: order.requestedSum,
      experience: order.experience,
      city: order.city,
      equipment,
    });

    const ai = await callAi(prompt);

    // Смета — только из анкеты, не из ответа ИИ (см. lib/plan-template.ts).
    // Непроверенные позиции помечаем прямо в тексте строки — это гарантия
    // кодом, а не просьбой к модели.
    const smeta = equipment.map((e) => ({
      item: e.confirmed ? e.item : `${e.item} (ориентировочно, уточнить у поставщика)`,
      sum: e.sum,
    }));

    const businessPlan: BusinessPlanInput = {
      title: ai.title,
      applicant: order.applicantName,
      region: region.name,
      city: order.city,
      requestedSum: order.requestedSum,
      date: new Date().toLocaleDateString("ru-RU"),
      pm: region.pmTrudosposobnyh,
      summary: ai.summary,
      applicantInfo: ai.applicantInfo,
      serviceDescription: ai.serviceDescription,
      marketAnalysis: ai.marketAnalysis,
      orgPlan: ai.orgPlan.map((s): [string, string] => [s.step, s.timeframe]),
      smeta,
      finance: ai.finance,
      breakeven: ai.breakeven,
      risks: ai.risks,
      attachments: [
        "Коммерческие предложения поставщиков на оборудование и материалы — на позиции и суммы из раздела 6 «Смета расходов»",
        "Копия паспорта заявителя",
      ],
      swot: ai.swot,
    };

    const pdfBytes = await buildBusinessPlanPdf(businessPlan);

    const tariff = getTariff(order.tariff);
    const excelBytes = tariff?.hasExcel
      ? await buildSmetaExcel(equipment, order.requestedSum)
      : null;

    await prisma.order.update({
      where: { id: orderId },
      data: {
        status: "ready",
        pdfBytes: Buffer.from(pdfBytes),
        excelBytes: excelBytes ? Buffer.from(excelBytes) : null,
        error: null,
      },
    });

    await sendPlanReadyEmail(orderId, order.email);
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error("generateOrder error:", orderId, message);
    await prisma.order.update({
      where: { id: orderId },
      data: { status: "failed", error: message.slice(0, 500) },
    });
    await sendGenerationFailedEmail(order.email);
  }
}
