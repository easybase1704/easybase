/**
 * 图片 WebP 化脚本
 * - 按目录分尺寸：产品600px / banner1400px / 案例+关于+新闻800px
 * - 质量80%，只生成 WebP，删除原 PNG/JPG
 * - 跳过 SVG
 */
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const IMAGE_DIR = path.join(__dirname, '..', 'src', 'images');
const QUALITY = 80;

// 目标宽度规则（从上到下匹配，先匹配到的生效）
const RULES = [
  // 根目录 banner 文件
  { match: (rel) => !rel.includes('/') && path.basename(rel).startsWith('banner-'), width: 1400 },
  // 子目录
  { match: (rel) => rel.startsWith('products/'), width: 600 },
  { match: (rel) => rel.startsWith('cases/'), width: 800 },
  { match: (rel) => rel.startsWith('about/'), width: 800 },
  { match: (rel) => rel.startsWith('news/'), width: 600 },
  // support, uploads 等保持原尺寸
];

function getTargetWidth(relPath) {
  for (const rule of RULES) {
    if (rule.match(relPath)) return rule.width;
  }
  return null; // null = 保持原尺寸
}

function* findImages(dir, baseDir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      yield* findImages(full, baseDir);
    } else if (/\.(png|jpe?g)$/i.test(entry.name)) {
      yield { fullPath: full, relPath: path.relative(baseDir, full).replace(/\\/g, '/') };
    }
  }
}

async function convertOne({ fullPath, relPath }) {
  const targetWidth = getTargetWidth(relPath);
  const origSize = fs.statSync(fullPath).size;

  let pipeline = sharp(fullPath);
  if (targetWidth) {
    pipeline = pipeline.resize(targetWidth, null, { withoutEnlargement: true, fit: 'inside' });
  }
  pipeline = pipeline.webp({ quality: QUALITY, effort: 4 });

  const webpPath = fullPath.replace(/\.(png|jpe?g)$/i, '.webp');
  await pipeline.toFile(webpPath);

  const webpSize = fs.statSync(webpPath).size;
  const savings = ((1 - webpSize / origSize) * 100).toFixed(0);
  const origKB = (origSize / 1024).toFixed(0);
  const webpKB = (webpSize / 1024).toFixed(0);
  const label = targetWidth ? `${targetWidth}px` : '原尺寸';

  // 删除原图
  fs.unlinkSync(fullPath);

  return { relPath, origKB, webpKB, savings, label };
}

async function main() {
  const images = [...findImages(IMAGE_DIR, IMAGE_DIR)];
  console.log(`找到 ${images.length} 个 PNG/JPG 文件\n`);

  let totalOrig = 0;
  let totalWebp = 0;

  for (let i = 0; i < images.length; i++) {
    const img = images[i];
    try {
      const r = await convertOne(img);
      totalOrig += parseInt(r.origKB);
      totalWebp += parseInt(r.webpKB);
      console.log(`[${String(i+1).padStart(3)}/${images.length}] ${r.relPath.padEnd(60)} ${r.origKB.padStart(6)}KB → ${r.webpKB.padStart(6)}KB  (${r.savings.padStart(3)}%)  [${r.label}]`);
    } catch (e) {
      console.error(`[${String(i+1).padStart(3)}/${images.length}] ❌ ${img.relPath}: ${e.message}`);
    }
  }

  const pct = ((1 - totalWebp / totalOrig) * 100).toFixed(0);
  console.log(`\n========================================`);
  console.log(`总计: ${totalOrig}KB → ${totalWebp}KB  体积减少 ${pct}%`);
  console.log(`原 PNG/JPG 已删除，仅保留 .webp`);
}
main().catch(e => { console.error(e); process.exit(1); });
