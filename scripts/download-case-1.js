const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

const BASE = 'http://easy-base.com.cn';
const OUT = path.join(__dirname, '..', 'src', 'images', 'cases');

const url = '/js/ueditor1_2_6_1-utf8-net/net/upload/2023-01-03/681baad6-836b-4495-a348-010230d80533.jpg';

function download(url, dest) {
  return new Promise((resolve, reject) => {
    const mod = url.startsWith('https') ? https : http;
    mod.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        download(res.headers.location.startsWith('http') ? res.headers.location : BASE + res.headers.location, dest)
          .then(resolve).catch(reject);
        return;
      }
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode} for ${url}`));
        return;
      }
      const file = fs.createWriteStream(dest);
      res.pipe(file);
      file.on('finish', () => { file.close(); resolve(); });
      file.on('error', reject);
    }).on('error', reject);
  });
}

(async () => {
  const fullUrl = BASE + url;
  const dest = path.join(OUT, 'case-1.jpg');
  console.log(`[下载] 智慧教育: ${fullUrl}`);
  try {
    await download(fullUrl, dest);
    const stat = fs.statSync(dest);
    console.log(`  → 完成: case-1.jpg (${(stat.size / 1024).toFixed(1)} KB)`);
  } catch (err) {
    console.error(`  ✗ 失败: ${err.message}`);
  }
})();
