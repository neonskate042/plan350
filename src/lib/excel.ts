// Смета в Excel — комиссии соцзащиты почти всегда просят расчёты отдельным файлом.
import ExcelJS from "exceljs";
import type { EquipmentItem } from "@/lib/plan-template";

export async function buildSmetaExcel(
  equipment: EquipmentItem[],
  requestedSum: number,
): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  const sheet = wb.addWorksheet("Смета расходов");

  sheet.columns = [
    { header: "Статья", key: "item", width: 55 },
    { header: "Сумма, ₽", key: "sum", width: 16 },
    { header: "Источник", key: "source", width: 28 },
  ];
  sheet.getRow(1).font = { bold: true };

  for (const e of equipment) {
    sheet.addRow({
      item: e.item,
      sum: e.sum,
      source: e.confirmed
        ? "Коммерческое предложение поставщика"
        : "Ориентировочно — уточнить перед подачей",
    });
  }

  const total = equipment.reduce((a, e) => a + e.sum, 0);
  const totalRow = sheet.addRow({ item: "Итого", sum: total, source: "" });
  totalRow.font = { bold: true };

  if (total !== requestedSum) {
    const noteRow = sheet.addRow({
      item: `Внимание: сумма позиций отличается от запрошенной суммы (${requestedSum.toLocaleString("ru-RU")} ₽) на ${Math.abs(total - requestedSum).toLocaleString("ru-RU")} ₽`,
    });
    noteRow.font = { italic: true, color: { argb: "FFB91C1C" } };
  }

  sheet.getColumn("sum").numFmt = "#,##0";

  const buf = await wb.xlsx.writeBuffer();
  return Buffer.from(buf);
}
