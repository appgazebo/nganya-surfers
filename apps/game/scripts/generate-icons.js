import fs from 'fs';
import zlib from 'zlib';

function createCRC32Table() {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      if (c & 1) c = 0xedb88320 ^ (c >>> 1);
      else c = c >>> 1;
    }
    table[n] = c;
  }
  return table;
}

const crcTable = createCRC32Table();
function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function makeChunk(type, data) {
  const len = data.length;
  const chunk = Buffer.alloc(4 + 4 + len + 4);
  chunk.writeUInt32BE(len, 0);
  chunk.write(type, 4, 4, 'ascii');
  data.copy(chunk, 8);
  const crc = crc32(chunk.subarray(4, 8 + len));
  chunk.writeUInt32BE(crc, 8 + len);
  return chunk;
}

function generatePNG(size, isMaskable) {
  const width = size;
  const height = size;

  // Raw uncompressed RGBA pixel rows (filter byte 0 per row)
  const rowSize = 1 + width * 4;
  const rawData = Buffer.alloc(rowSize * height);

  const cx = width / 2;
  const cy = height / 2;
  const rMax = width / 2;

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize;
    rawData[rowOffset] = 0; // Filter byte: None

    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * 4;
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Background gradient: Dark Cyber Indigo (#0f172a to #0b0c10)
      let r = 15;
      let g = 23;
      let b = 42;
      let a = 255;

      if (!isMaskable && dist > rMax - 2) {
        // Rounded app icon circle for non-maskable
        a = 0;
      }

      // Border neon ring
      if (dist >= rMax * 0.88 && dist <= rMax * 0.96) {
        // Hot pink / orange neon ring
        r = 255;
        g = 0;
        b = 128;
      }

      // Inner glowing circle background (#1e1b4b)
      if (dist < rMax * 0.88) {
        r = 20;
        g = 20;
        b = 50;
      }

      // Matatu Minibus Silhouette in center
      // Body box: center around cy + 10, width ~0.55 * size, height ~0.35 * size
      const busW = width * 0.52;
      const busH = height * 0.34;
      const busX = cx - busW / 2;
      const busY = cy - busH / 3;

      if (x >= busX && x <= busX + busW && y >= busY && y <= busY + busH) {
        // Vibrant hot orange / gold matatu body (#f59e0b)
        r = 245;
        g = 158;
        b = 11;

        // Windshield window (electric blue #38bdf8)
        if (x >= busX + busW * 0.12 && x <= busX + busW * 0.45 && y >= busY + busH * 0.15 && y <= busY + busH * 0.50) {
          r = 56;
          g = 189;
          b = 248;
        }

        // Side windows
        if (x >= busX + busW * 0.52 && x <= busX + busW * 0.88 && y >= busY + busH * 0.15 && y <= busY + busH * 0.50) {
          r = 56;
          g = 189;
          b = 248;
        }

        // Underglow neon strip (#06d6a0)
        if (y >= busY + busH * 0.82) {
          r = 6;
          g = 214;
          b = 160;
        }
      }

      // Wheels (two wheels below body)
      const wheelR = width * 0.08;
      const w1x = cx - busW * 0.28;
      const w2x = cx + busW * 0.28;
      const wy = busY + busH + 2;

      const d1 = Math.sqrt((x - w1x) ** 2 + (y - wy) ** 2);
      const d2 = Math.sqrt((x - w2x) ** 2 + (y - wy) ** 2);

      if (d1 <= wheelR || d2 <= wheelR) {
        // Rubber tire #111111
        r = 18;
        g = 18;
        b = 20;
        if (d1 <= wheelR * 0.5 || d2 <= wheelR * 0.5) {
          // Chrome rim
          r = 220;
          g = 220;
          b = 230;
        }
      }

      // Headlight Xenon Beams (cyan #00f0ff)
      if (x < busX && x >= busX - width * 0.16 && y >= busY + busH * 0.55 && y <= busY + busH * 0.78) {
        r = 0;
        g = 240;
        b = 255;
      }

      rawData[pxOffset] = r;
      rawData[pxOffset + 1] = g;
      rawData[pxOffset + 2] = b;
      rawData[pxOffset + 3] = a;
    }
  }

  // Compress IDAT
  const compressed = zlib.deflateSync(rawData);

  // PNG Signature
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  // IHDR
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // 8 bits per channel
  ihdr[9] = 6; // RGBA
  ihdr[10] = 0; // Deflate
  ihdr[11] = 0; // Filter
  ihdr[12] = 0; // No interlace

  const ihdrChunk = makeChunk('IHDR', ihdr);
  const idatChunk = makeChunk('IDAT', compressed);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([sig, ihdrChunk, idatChunk, iendChunk]);
}

// Generate icons
fs.writeFileSync('public/icons/icon-192.png', generatePNG(192, false));
fs.writeFileSync('public/icons/icon-512.png', generatePNG(512, false));
fs.writeFileSync('public/icons/icon-maskable-512.png', generatePNG(512, true));
console.log('Icons generated successfully in public/icons/');
