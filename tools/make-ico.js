// Wraps build/icon.png (256x256) into build/icon.ico (PNG-compressed ICO).
const fs = require('fs');
const path = require('path');
const png = fs.readFileSync(path.join(__dirname, '..', 'build', 'icon.png'));
const head = Buffer.alloc(22);
head.writeUInt16LE(0, 0); head.writeUInt16LE(1, 2); head.writeUInt16LE(1, 4); // reserved, type=icon, count=1
head.writeUInt8(0, 6); head.writeUInt8(0, 7);                                   // 256 x 256
head.writeUInt8(0, 8); head.writeUInt8(0, 9);
head.writeUInt16LE(1, 10); head.writeUInt16LE(32, 12);                          // planes, bpp
head.writeUInt32LE(png.length, 14); head.writeUInt32LE(22, 18);                 // size, offset
fs.writeFileSync(path.join(__dirname, '..', 'build', 'icon.ico'), Buffer.concat([head, png]));
console.log('icon.ico written');
