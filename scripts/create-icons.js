/**
 * Create minimal tab bar icons for WeChat Mini Program
 * Icons are 32x32 PNG with simple shapes
 * Run: node scripts/create-icons.js
 */

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const iconsDir = path.join(__dirname, '..', 'assets', 'icons');

// CRC32 implementation for PNG
function crc32(data) {
  let crc = 0xFFFFFFFF;
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) {
      c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[i] = c;
  }
  for (let i = 0; i < data.length; i++) {
    crc = table[(crc ^ data[i]) & 0xFF] ^ (crc >>> 8);
  }
  crc = crc ^ 0xFFFFFFFF;
  const result = Buffer.alloc(4);
  result.writeUInt32BE(crc >>> 0, 0);
  return result;
}

// Create a PNG with pixel data
function createPNG(width, height, pixels) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  
  // IHDR chunk
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8;  // bit depth
  ihdrData[9] = 6;  // color type (RGBA)
  ihdrData[10] = 0; // compression
  ihdrData[11] = 0; // filter
  ihdrData[12] = 0; // interlace
  
  const ihdrCrc = crc32(Buffer.concat([Buffer.from('IHDR'), ihdrData]));
  const ihdrChunk = Buffer.concat([
    Buffer.from([0, 0, 0, 13]),
    Buffer.from('IHDR'),
    ihdrData,
    ihdrCrc
  ]);
  
  // Image data with filter bytes
  const rawData = [];
  for (let y = 0; y < height; y++) {
    rawData.push(0); // filter byte (none)
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      rawData.push(pixels[idx], pixels[idx + 1], pixels[idx + 2], pixels[idx + 3]);
    }
  }
  
  const compressed = zlib.deflateSync(Buffer.from(rawData), { level: 9 });
  
  const idatCrc = crc32(Buffer.concat([Buffer.from('IDAT'), compressed]));
  const idatLen = Buffer.alloc(4);
  idatLen.writeUInt32BE(compressed.length, 0);
  const idatChunk = Buffer.concat([
    idatLen,
    Buffer.from('IDAT'),
    compressed,
    idatCrc
  ]);
  
  // IEND chunk
  const iendCrc = crc32(Buffer.from('IEND'));
  const iendChunk = Buffer.concat([
    Buffer.from([0, 0, 0, 0]),
    Buffer.from('IEND'),
    iendCrc
  ]);
  
  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

// Draw a circle (for nearby/location icon)
function drawLocationIcon(size, r, g, b) {
  const pixels = new Uint8Array(size * size * 4);
  const cx = size / 2;
  const cy = size / 2 - 2;
  const outerRadius = size / 3;
  const innerRadius = size / 6;
  
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4;
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      // Circle with hole
      if (dist <= outerRadius && dist >= innerRadius) {
        pixels[idx] = r;
        pixels[idx + 1] = g;
        pixels[idx + 2] = b;
        pixels[idx + 3] = 255;
      }
      // Pin bottom
      else if (y > cy + 2 && y < size - 2 && Math.abs(dx) < (size - y) / 3) {
        pixels[idx] = r;
        pixels[idx + 1] = g;
        pixels[idx + 2] = b;
        pixels[idx + 3] = 255;
      }
      else {
        pixels[idx] = 0;
        pixels[idx + 1] = 0;
        pixels[idx + 2] = 0;
        pixels[idx + 3] = 0;
      }
    }
  }
  return pixels;
}

// Draw calendar/slots icon
function drawSlotsIcon(size, r, g, b) {
  const pixels = new Uint8Array(size * size * 4);
  const padding = 4;
  const headerHeight = 6;
  
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4;
      
      const inBox = x >= padding && x < size - padding && y >= padding + headerHeight && y < size - padding;
      const isHeader = x >= padding && x < size - padding && y >= padding && y < padding + headerHeight;
      const isBorder = inBox && (x === padding || x === size - padding - 1 || y === padding + headerHeight || y === size - padding - 1);
      
      // Calendar handle
      const isHandle = (x === padding + 5 || x === size - padding - 6) && y >= padding - 2 && y < padding + 2;
      
      // Grid lines
      const gridX = Math.floor((x - padding) / ((size - 2 * padding) / 3));
      const gridY = Math.floor((y - padding - headerHeight) / ((size - 2 * padding - headerHeight) / 3));
      const isGrid = inBox && !isBorder && ((x - padding) % Math.floor((size - 2 * padding) / 3) === 0 || (y - padding - headerHeight) % Math.floor((size - 2 * padding - headerHeight) / 3) === 0);
      
      if (isHeader || isBorder || isHandle || isGrid) {
        pixels[idx] = r;
        pixels[idx + 1] = g;
        pixels[idx + 2] = b;
        pixels[idx + 3] = 255;
      } else {
        pixels[idx] = 0;
        pixels[idx + 1] = 0;
        pixels[idx + 2] = 0;
        pixels[idx + 3] = 0;
      }
    }
  }
  return pixels;
}

// Draw person/profile icon
function drawProfileIcon(size, r, g, b) {
  const pixels = new Uint8Array(size * size * 4);
  const cx = size / 2;
  
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4;
      
      // Head (circle)
      const headCy = size / 3;
      const headRadius = size / 5;
      const headDist = Math.sqrt((x - cx) ** 2 + (y - headCy) ** 2);
      
      // Body (arc)
      const bodyCy = size + size / 3;
      const bodyRadius = size * 0.7;
      const bodyDist = Math.sqrt((x - cx) ** 2 + (y - bodyCy) ** 2);
      
      if (headDist <= headRadius || (bodyDist <= bodyRadius && bodyDist >= bodyRadius - 4 && y > size / 2 && y < size - 2)) {
        pixels[idx] = r;
        pixels[idx + 1] = g;
        pixels[idx + 2] = b;
        pixels[idx + 3] = 255;
      } else {
        pixels[idx] = 0;
        pixels[idx + 1] = 0;
        pixels[idx + 2] = 0;
        pixels[idx + 3] = 0;
      }
    }
  }
  return pixels;
}

// Create all icons
const size = 32;
const gray = [140, 140, 140];
const green = [82, 196, 26];

const icons = [
  { name: 'nearby.png', draw: drawLocationIcon, color: gray },
  { name: 'nearby-active.png', draw: drawLocationIcon, color: green },
  { name: 'slots.png', draw: drawSlotsIcon, color: gray },
  { name: 'slots-active.png', draw: drawSlotsIcon, color: green },
  { name: 'profile.png', draw: drawProfileIcon, color: gray },
  { name: 'profile-active.png', draw: drawProfileIcon, color: green },
];

console.log('Creating icons in:', iconsDir);

for (const { name, draw, color } of icons) {
  const pixels = draw(size, ...color);
  const png = createPNG(size, size, pixels);
  const filePath = path.join(iconsDir, name);
  fs.writeFileSync(filePath, png);
  console.log(`✅ Created ${name} - Size: ${png.length} bytes`);
}

console.log('\n🎉 All icons created successfully!');


