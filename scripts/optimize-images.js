/**
 * 图片优化脚本
 * - PNG/JPG → 最大1600px宽 + 压缩
 * - 同时生成 WebP 版本（体积小5-10倍）
 * - 跳过已处理的图片（通过 .optimized 标记文件）
 */
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const MAX_WIDTH = 1600;
const PNG_QUALITY = 85;
const WEBP_QUALITY = 80;
const IMAGE_DIR = path.join(__dirname, '..', 'src', 'images');
const MARKER_FILE = path.join(IMAGE_DIR, '.optimized');

// Recursively find all PNG/JPG files
function* findImages(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      yield* findImages(full);
    } else if (/\.(png|jpe?g)$/i.test(entry.name) && !entry.name.includes('.tmp.')) {
      yield full;
    }
  }
}

function formatSize(bytes) {
  if (bytes < 1024) return bytes + 'B';
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + 'KB';
  return (bytes / 1048576).toFixed(1) + 'MB';
}

async function optimizeImage(filePath) {
  const ext = path.extname(filePath);
  const webpPath = filePath.replace(ext, '.webp');
  const originalSize = fs.statSync(filePath).size;
  const meta = await sharp(filePath).metadata();

  let needsResize = meta.width > MAX_WIDTH;

  // Optimize PNG/JPEG
  if (needsResize) {
    const tmp = filePath + '.tmp';
    await sharp(filePath)
      .resize(MAX_WIDTH, null, { withoutEnlargement: true })
      .png({ quality: PNG_QUALITY, compressionLevel: 9 })
      .toFile(tmp);
    fs.renameSync(tmp, filePath);
  } else {
    // Just recompress without resize
    const tmp = filePath + '.tmp';
    await sharp(filePath)
      .png({ quality: PNG_QUALITY, compressionLevel: 9 })
      .toFile(tmp);
    fs.renameSync(tmp, filePath);
  }

  const newSize = fs.statSync(filePath).size;
  const pct1 = originalSize > 0 ? ((1 - newSize / originalSize) * 100).toFixed(0) : 0;

  // Generate WebP (always, regardless of whether we resized)
  await sharp(filePath)
    .webp({ quality: WEBP_QUALITY })
    .toFile(webpPath);

  const webpSize = fs.statSync(webpPath).size;
  const pct2 = originalSize > 0 ? ((1 - webpSize / originalSize) * 100).toFixed(0) : 0;

  const relPath = path.relative(IMAGE_DIR, filePath);
  console.log(
    `${relPath}: ${meta.width}×${meta.height} ${formatSize(originalSize)} → ` +
    `${formatSize(newSize)}(-${pct1}%) + WebP ${formatSize(webpSize)}(-${pct2}%)`
  );

  return { originalSize, newSize, webpSize };
}

async function main() {
  if (fs.existsSync(MARKER_FILE)) {
    console.log('⏭️  图片已优化过（删除 src/images/.optimized 可强制重新处理）');
    return;
  }

  console.log('🔧 图片优化中...\n');

  let totalOrig = 0, totalNew = 0, totalWebp = 0, count = 0;

  for (const file of findImages(IMAGE_DIR)) {
    try {
      const result = await optimizeImage(file);
      totalOrig += result.originalSize;
      totalNew += result.newSize;
      totalWebp += result.webpSize;
      count++;
    } catch (e) {
      console.error(`  ❌ ${path.relative(IMAGE_DIR, file)}: ${e.message}`);
    }
  }

  // Write marker so we don't re-optimize
  fs.writeFileSync(MARKER_FILE, new Date().toISOString());

  console.log(`\n✅ 完成！处理了 ${count} 张图片`);
  console.log(`   原始: ${formatSize(totalOrig)}`);
  console.log(`   PNG优化后: ${formatSize(totalNew)} (-${totalOrig > 0 ? ((1 - totalNew / totalOrig) * 100).toFixed(0) : 0}%)`);
  console.log(`   WebP版本: ${formatSize(totalWebp)} (-${totalOrig > 0 ? ((1 - totalWebp / totalOrig) * 100).toFixed(0) : 0}%)`);
}

main().catch(e => { console.error(e); process.exit(1); });
