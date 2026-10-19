/**
 * Renders the app icons from src/app/icon.svg with Playwright's Chromium (no image packages).
 * Usage: npx tsx scripts/make-icons.ts — rerun only when the icon changes.
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { chromium, type Browser } from "@playwright/test";

const svg = readFileSync("src/app/icon.svg", "utf8");
// Maskable icons are cropped to a circle or squircle: full-bleed colour, mark in the safe 80 %.
const maskable = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <rect width="32" height="32" fill="#6B1F33"/>
  <g transform="translate(16 16) scale(0.72) translate(-16 -16)">${svg
    .replace(/^[\s\S]*?<rect[^>]*\/>/, "")
    .replace(/<\/svg>\s*$/, "")}</g>
</svg>`;

async function render(
  browser: Browser,
  markup: string,
  size: number,
): Promise<Buffer> {
  const page = await browser.newPage({
    viewport: { width: size, height: size },
  });
  await page.setContent(
    `<html><body style="margin:0;background:transparent">${markup.replace(
      "<svg ",
      `<svg width="${size}" height="${size}" `,
    )}</body></html>`,
  );
  const png = await page.locator("svg").screenshot({ omitBackground: true });
  await page.close();
  return png;
}

/** An .ico file holding PNG images (supported by every current browser). */
function ico(images: { size: number; png: Buffer }[]): Buffer {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(images.length, 4);
  let offset = 6 + 16 * images.length;
  const entries = images.map(({ size, png }) => {
    const entry = Buffer.alloc(16);
    entry.writeUInt8(size >= 256 ? 0 : size, 0);
    entry.writeUInt8(size >= 256 ? 0 : size, 1);
    entry.writeUInt16LE(1, 4);
    entry.writeUInt16LE(32, 6);
    entry.writeUInt32LE(png.length, 8);
    entry.writeUInt32LE(offset, 12);
    offset += png.length;
    return entry;
  });
  return Buffer.concat([header, ...entries, ...images.map((i) => i.png)]);
}

async function main() {
  const browser = await chromium.launch();
  const draw = (markup: string, size: number) => render(browser, markup, size);
  mkdirSync("public/icons", { recursive: true });
  writeFileSync("public/icons/icon-192.png", await draw(svg, 192));
  writeFileSync("public/icons/icon-512.png", await draw(svg, 512));
  writeFileSync("public/icons/maskable-512.png", await draw(maskable, 512));
  writeFileSync("src/app/apple-icon.png", await draw(maskable, 180));
  const small = [];
  for (const size of [16, 32, 48])
    small.push({ size, png: await draw(svg, size) });
  writeFileSync("src/app/favicon.ico", ico(small));
  await browser.close();
  console.log("Icons written.");
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
