import fs from "fs";

const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");

const file = process.argv[2];
const data = new Uint8Array(fs.readFileSync(file));
const doc = await pdfjs.getDocument({ data, disableFontFace: true }).promise;

console.log(`Страниц: ${doc.numPages}\n`);

for (let i = 1; i <= doc.numPages; i++) {
  const page = await doc.getPage(i);
  const content = await page.getTextContent();
  const viewport = page.getViewport({ scale: 1 });
  console.log(`=== Страница ${i} (высота ${Math.round(viewport.height)}pt) ===`);
  // Печатаем каждый текстовый фрагмент с его Y-координатой (снизу страницы),
  // отсортированный сверху вниз — так видно, что реально нарисовано и где.
  const items = content.items
    .filter((it) => it.str.trim().length > 0)
    .map((it) => ({ y: Math.round(it.transform[5]), str: it.str }))
    .sort((a, b) => b.y - a.y);
  for (const it of items) {
    console.log(`  y=${String(it.y).padStart(4)}  "${it.str}"`);
  }
  console.log();
}
