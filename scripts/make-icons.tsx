// Regenerates the PNG icons (manifest, Apple touch icon) from the mark in src/app/icon.svg.
// Run: npx tsx scripts/make-icons.tsx
import { writeFileSync } from "node:fs";
import { ImageResponse } from "next/og";

const ACCENT = "#1F5FE0";
const PATH = "M22.6 11.4A8 8 0 1 0 24 16H16.5";

async function png(size: number, inset: number, rounded: boolean, out: string) {
  const mark = size - inset * 2;
  const res = new ImageResponse(
    <div
      style={{
        width: size,
        height: size,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: ACCENT,
        borderRadius: rounded ? size / 4 : 0,
      }}
    >
      <svg width={mark} height={mark} viewBox="0 0 32 32">
        <path
          d={PATH}
          fill="none"
          stroke="#FFFFFF"
          strokeWidth="3.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>,
    { width: size, height: size },
  );
  const data = Buffer.from(await res.arrayBuffer());
  if (out.endsWith(".ico")) {
    // An ICO can hold a PNG image: 6-byte header + one 16-byte entry, then the PNG.
    const head = Buffer.alloc(22);
    head.writeUInt16LE(1, 2);
    head.writeUInt16LE(1, 4);
    head[6] = size;
    head[7] = size;
    head.writeUInt16LE(1, 12);
    head.writeUInt16LE(32, 14);
    head.writeUInt32LE(data.length, 16);
    head.writeUInt32LE(22, 18);
    writeFileSync(out, Buffer.concat([head, data]));
  } else writeFileSync(out, data);
  console.log("wrote", out);
}

async function main() {
  await png(192, 24, true, "public/icons/icon-192.png");
  await png(512, 64, true, "public/icons/icon-512.png");
  // Maskable: full-bleed background, mark inside the 80 % safe zone.
  await png(512, 128, false, "public/icons/maskable-512.png");
  await png(180, 22, false, "src/app/apple-icon.png");
  await png(48, 6, true, "src/app/favicon.ico");
}

void main();
