#!/usr/bin/env node
/**
 * أيقونات إحنا.
 *
 * تُولَّد بالكود لا بمحرر صور، لسببين: لا تبعية جديدة، وأهم منها أن
 * الأيقونة تصير **قابلة للتفسير** — من يفتح الملف بعد سنتين يرى كيف رُسمت
 * ويغيّر لونًا بسطر، بدل ملف ثنائي ظهر من العدم.
 *
 *   npx tsx scripts/ehna-icons.mts
 *
 * الرسم: تدرّج بنفسجي→مَجنتا (لونا الاثنين)، وفي وسطه معيّن غامق —
 * نفس رمز ◈ الذي يتكرر في الواجهة.
 */
import { deflateSync } from "node:zlib";
import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const OUT = "apps/ehna/public";

/** CRC32 — يحتاجه كل chunk في PNG. */
const TABLE = new Uint32Array(256).map((_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});

function crc32(buf: Buffer): number {
  let c = 0xffffffff;
  for (const byte of buf) c = TABLE[(c ^ byte) & 0xff]! ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type: string, data: Buffer): Buffer {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

function png(width: number, height: number, rgba: Buffer): Buffer {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;    // عمق البت
  ihdr[9] = 6;    // RGBA
  // سطر لكل صف مسبوق ببايت مرشِّح صفر — أبسط صيغة وأوضحها
  const raw = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (width * 4 + 1)] = 0;
    rgba.copy(raw, y * (width * 4 + 1) + 1, y * width * 4, (y + 1) * width * 4);
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

const VIOLET = [0xa8, 0x55, 0xf7] as const;
const MAGENTA = [0xf4, 0x72, 0xb6] as const;
const VOID = [0x0a, 0x05, 0x14] as const;

/**
 * `padding` يترك هامشًا آمنًا للأيقونة القابلة للقص (maskable): أندرويد
 * يقص الحواف في أشكال مختلفة، ورمز يلمس الحافة يخرج منه مبتورًا.
 */
function draw(size: number, padding: number): Buffer {
  const px = Buffer.alloc(size * size * 4);
  const mid = (size - 1) / 2;
  const arm = (size / 2) * (1 - padding);

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const t = (x + y) / (2 * size);          // تدرّج قطري
      let r = Math.round(VIOLET[0] + (MAGENTA[0] - VIOLET[0]) * t);
      let g = Math.round(VIOLET[1] + (MAGENTA[1] - VIOLET[1]) * t);
      let b = Math.round(VIOLET[2] + (MAGENTA[2] - VIOLET[2]) * t);

      // المعيّن: |dx| + |dy| ≤ نصف القطر
      const d = Math.abs(x - mid) + Math.abs(y - mid);
      if (d < arm * 0.62) {
        const edge = Math.min(1, (arm * 0.62 - d) / 2);   // حافة ناعمة
        r = Math.round(r + (VOID[0] - r) * edge);
        g = Math.round(g + (VOID[1] - g) * edge);
        b = Math.round(b + (VOID[2] - b) * edge);
      }

      const i = (y * size + x) * 4;
      px[i] = r; px[i + 1] = g; px[i + 2] = b; px[i + 3] = 255;
    }
  }
  return px;
}

mkdirSync(OUT, { recursive: true });

const files: Array<[string, number, number]> = [
  ["icon-192.png", 192, 0],
  ["icon-512.png", 512, 0],
  // القابلة للقص تحتاج هامشًا: أندرويد يقص حتى ٢٠٪ من كل حافة
  ["icon-maskable-512.png", 512, 0.2],
  ["apple-touch-icon.png", 180, 0],
];

for (const [name, size, padding] of files) {
  const file = join(OUT, name);
  writeFileSync(file, png(size, size, draw(size, padding)));
  console.log(`  ✓ ${file}`);
}
