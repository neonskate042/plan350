// Живой прогон генерации без базы данных — тот же путь (промпт → ChadGPT → PDF),
// что и в проде (src/lib/generate.ts → generateOrder), но результат просто
// сохраняется в samples/, а не уходит клиенту по почте.
// Запуск из корня проекта: pnpm exec tsx dev-tools/test-generate.mts
import fs from "fs";
import path from "path";
import process from "process";

// Node 20.6+ умеет читать .env сам — без сторонней библиотеки.
process.loadEnvFile(path.join(process.cwd(), ".env"));
import { getRegion } from "../src/lib/regions";
import { buildPrompt, type EquipmentItem } from "../src/lib/plan-template";
import { callAi } from "../src/lib/generate";
import { buildBusinessPlanPdf, type BusinessPlanInput } from "../src/pdf/business-plan-pdf";
import { buildSmetaExcel } from "../src/lib/excel";

async function main() {
  const region = getRegion("krasnodarsky");
  if (!region) throw new Error("регион не найден");

  const equipment: EquipmentItem[] = [
    { item: "Лампа для сушки гель-лака (LED/UV)", sum: 8000, confirmed: false },
    { item: "Фрезер для маникюра с педалью", sum: 12000, confirmed: false },
    { item: "Стерилизатор (сухожар) для инструментов", sum: 15000, confirmed: false },
    { item: "Стартовый запас расходных материалов (гель-лак, базы, топы, пилки)", sum: 90000, confirmed: false },
    { item: "Стол мастера и кресло клиента", sum: 45000, confirmed: false },
    { item: "Рабочая лампа-лупа", sum: 7000, confirmed: false },
    { item: "Вытяжка для маникюрного стола", sum: 10000, confirmed: true },
    { item: "Тумба для хранения материалов", sum: 20000, confirmed: false },
    { item: "Стойка-витрина для материалов", sum: 15000, confirmed: false },
    { item: "Увлажнитель воздуха для рабочего помещения", sum: 25000, confirmed: false },
    { item: "Реклама (визитки, страница в соцсетях, вывеска)", sum: 8000, confirmed: false },
    { item: "Регистрация ИП, патент на первый период", sum: 5000, confirmed: false },
    { item: "Непредвиденные расходы", sum: 10000, confirmed: false },
  ];
  const requestedSum = equipment.reduce((a, e) => a + e.sum, 0);

  const prompt = buildPrompt({
    region,
    activity: "Услуги маникюра и наращивания ногтей на дому",
    requestedSum,
    experience: "Проходит обучение в частной школе маникюра, диплом ожидается через месяц",
    city: "г. Армавир",
    equipment,
  });

  console.log("=== ПРОМПТ ===\n", prompt, "\n");
  console.log("Запрос к ChadGPT...");
  const t0 = Date.now();
  const ai = await callAi(prompt);
  console.log(`Ответ получен за ${((Date.now() - t0) / 1000).toFixed(1)} с\n`);
  console.log("=== ОТВЕТ ИИ (JSON) ===\n", JSON.stringify(ai, null, 2));

  const smeta = equipment.map((e) => ({
    item: e.confirmed ? e.item : `${e.item} (ориентировочно, уточнить у поставщика)`,
    sum: e.sum,
  }));

  const businessPlan: BusinessPlanInput = {
    title: ai.title,
    applicant: "Петрова Анна Викторовна",
    region: region.name,
    city: "г. Армавир",
    requestedSum,
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
  const excelBytes = await buildSmetaExcel(equipment, requestedSum);

  const outDir = path.join(process.cwd(), "samples");
  fs.writeFileSync(path.join(outDir, "primer-manikur-krasnodarsky.pdf"), pdfBytes);
  fs.writeFileSync(path.join(outDir, "primer-manikur-krasnodarsky-smeta.xlsx"), excelBytes);
  console.log("\nГотово: samples/primer-manikur-krasnodarsky.pdf и .xlsx");
}

main().catch((e) => {
  console.error("ОШИБКА:", e);
  process.exit(1);
});
