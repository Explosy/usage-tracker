import { deflateSync } from 'node:zlib';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const COLOR = [56, 189, 248, 255];
const BARS = [
  { x: 5, h: 10 },
  { x: 13, h: 18 },
  { x: 21, h: 26 }
];

function renderPng(size) {
  const scale = size / 32;
  const pixels = new Uint8Array(size * size * 4);

  const setPixel = (x, y) => {
    const i = (y * size + x) * 4;
    pixels.set(COLOR, i);
  };

  for (const { x, h } of BARS) {
    const bx = Math.round(x * scale);
    const bw = Math.round(6 * scale);
    const bh = Math.round(h * scale);
    const bottom = Math.round(3 * scale);
    for (let dy = 0; dy < bh; dy++) {
      for (let dx = 0; dx < bw; dx++) {
        setPixel(bx + dx, size - bottom - bh + dy);
      }
    }
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;

  const raw = Buffer.alloc(size * (1 + size * 4));
  for (let y = 0; y < size; y++) {
    const start = y * (1 + size * 4);
    raw[start] = 0;
    Buffer.from(pixels.buffer, y * size * 4, size * 4).copy(raw, start + 1);
  }

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0))
  ]);
}

function pngToIco(png, size) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(1, 4);

  const entry = Buffer.alloc(16);
  entry[0] = size >= 256 ? 0 : size;
  entry[1] = size >= 256 ? 0 : size;
  entry.writeUInt16LE(1, 4);
  entry.writeUInt16LE(32, 6);
  entry.writeUInt32LE(png.length, 8);
  entry.writeUInt32LE(22, 12);

  return Buffer.concat([header, entry, png]);
}

function crc32(buf) {
  let table = crc32.table;
  if (!table) {
    table = crc32.table = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      table[n] = c >>> 0;
    }
  }
  let crc = 0xffffffff;
  for (const byte of buf) crc = table[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

const outDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'resources');
mkdirSync(outDir, { recursive: true });

const tray = renderPng(32);
writeFileSync(join(outDir, 'tray.png'), tray);
console.log('Wrote resources/tray.png');

const app = renderPng(256);
writeFileSync(join(outDir, 'icon.png'), app);
writeFileSync(join(outDir, 'icon.ico'), pngToIco(app, 256));
console.log('Wrote resources/icon.png + resources/icon.ico');
