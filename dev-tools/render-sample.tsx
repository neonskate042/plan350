// Дев-скрипт: рендерит демонстрационный образец плана в PDF для ручной проверки.
// Запуск из корня проекта: pnpm exec tsx dev-tools/render-sample.tsx
import fs from "fs";
import path from "path";
import { buildBusinessPlanPdf } from "../src/pdf/business-plan-pdf";
import { sample } from "../src/pdf/sample-data";

async function main() {
  const buf = await buildBusinessPlanPdf(sample);
  const out = path.join(process.cwd(), "samples", "primer-shinomontazh-sverdlovskaya-v8.pdf");
  fs.writeFileSync(out, buf);
  console.log("Готово:", out);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
