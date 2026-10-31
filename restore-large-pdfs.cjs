'use strict';
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const root = __dirname;
const map = JSON.parse(fs.readFileSync(path.join(root, 'PDF-PARTS.json'), 'utf8'));
const verifyOnly = process.argv.includes('--verify-only');
function inside(relative) {
  const result = path.resolve(root, relative);
  if (result === root || !result.startsWith(root + path.sep)) throw new Error('路径超出仓库目录');
  return result;
}
function hashFile(file) {
  const digest = crypto.createHash('sha256');
  const fd = fs.openSync(file, 'r');
  const buffer = Buffer.alloc(1024 * 1024);
  try {
    for (;;) { const n = fs.readSync(fd, buffer, 0, buffer.length, null); if (!n) break; digest.update(buffer.subarray(0, n)); }
  } finally { fs.closeSync(fd); }
  return digest.digest('hex');
}
let verified = 0;
for (const pdf of map.files) {
  const combined = crypto.createHash('sha256');
  let total = 0;
  for (const part of pdf.parts) {
    const file = inside(part.path);
    if (!fs.existsSync(file) || fs.statSync(file).size !== part.bytes) throw new Error('分卷尚未完整下载，请先运行 git lfs pull：' + part.path);
    const bytes = fs.readFileSync(file);
    if (crypto.createHash('sha256').update(bytes).digest('hex') !== part.sha256) throw new Error('分卷校验不一致：' + part.path);
    combined.update(bytes); total += bytes.length;
  }
  if (total !== pdf.bytes || combined.digest('hex') !== pdf.sha256) throw new Error('PDF 完整性校验不一致');
  if (!verifyOnly) for (const relative of pdf.paths) {
    const target = inside(relative);
    if (fs.existsSync(target)) {
      if (fs.statSync(target).size !== pdf.bytes || hashFile(target) !== pdf.sha256) throw new Error('已有文件内容不同，已停止以保护原文件：' + relative);
      continue;
    }
    fs.mkdirSync(path.dirname(target), { recursive: true });
    const temporary = target + '.restoring-' + process.pid;
    let fd;
    try {
      fd = fs.openSync(temporary, 'wx');
      for (const part of pdf.parts) {
        const bytes = fs.readFileSync(inside(part.path));
        let offset = 0;
        while (offset < bytes.length) {
          const n = fs.writeSync(fd, bytes, offset, bytes.length - offset);
          if (!n) throw new Error('写入失败');
          offset += n;
        }
      }
      fs.closeSync(fd); fd = undefined;
      if (fs.statSync(temporary).size !== pdf.bytes || hashFile(temporary) !== pdf.sha256) throw new Error('还原文件校验不一致');
      fs.linkSync(temporary, target); // Fails safely if a target appeared concurrently.
      fs.unlinkSync(temporary);
    } catch (error) {
      if (fd !== undefined) fs.closeSync(fd);
      if (fs.existsSync(temporary)) fs.unlinkSync(temporary);
      throw error;
    }
  }
  verified++;
  console.log((verifyOnly ? '已校验：' : '已还原：') + pdf.paths[0]);
}
console.log('完成：' + verified + ' 份 PDF，全部 SHA-256 与原件一致。');

