// Дампит тело запроса к ChadGPT в файл — для диагностики через curl,
// в обход fetch()/https.request(), которые в этой песочнице ведут себя
// нестабильно на длинных запросах.
import fs from "fs";
import { getRegion } from "../src/lib/regions";
import { buildPrompt, type EquipmentItem } from "../src/lib/plan-template";

const region = getRegion("krasnodarsky")!;

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
          properties: { step: { type: "string" }, timeframe: { type: "string" } },
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
      "title", "summary", "applicantInfo", "serviceDescription", "marketAnalysis",
      "orgPlan", "finance", "breakeven", "risks", "swot",
    ],
  },
};

const body = {
  model: "claude-5-sonnet",
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
};

fs.writeFileSync("chadgpt-payload.json", JSON.stringify(body));
fs.writeFileSync("chadgpt-meta.json", JSON.stringify({ equipment, requestedSum, region: "krasnodarsky", city: "г. Армавир" }, null, 2));
console.log("Записано: chadgpt-payload.json,", Buffer.byteLength(JSON.stringify(body)), "байт");
