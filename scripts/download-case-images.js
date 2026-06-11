const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

const BASE = 'http://easy-base.com.cn';

const images = [
  { oid: 1, url: null, name: null }, // 智慧教育 - 无配图，跳过
  { oid: 2, url: '/js/ueditor1_2_6_1-utf8-net/net/upload/2023-01-03/283dc863-2e44-4980-85f4-68db32cf8718.jpg', name: '智慧办公' },
  { oid: 3, url: '/js/ueditor1_2_6_1-utf8-net/net/upload/2022-12-23/2bc95d11-eae0-47bf-a1e3-ad8278eefd1f.jpg', name: '智慧园区' },
  { oid: 4, url: '/js/ueditor1_2_6_1-utf8-net/net/upload/2024-07-03/bdd109d7-226c-4ece-833c-0b1eae9ffc07.jpg', name: '智慧零售' },
  { oid: 6, url: '/js/ueditor1_2_6_1-utf8-net/net/upload/2024-06-30/fbee51ba-d90b-4dce-b5f0-eec9f94f0de0.jpg', name: '智慧交通' },
  { oid: 7, url: '/js/ueditor1_2_6_1-utf8-net/net/upload/2024-06-30/22eef384-6f37-4f2a-9177-a02d13d4ce19.jpg', name: '智慧医疗' },
  { oid: 8, url: '/js/ueditor1_2_6_1-utf8-net/net/upload/2024-06-30/11830108-325d-4d66-a79b-c053cc78754e.jpg', name: '智能制造' },
  { oid: 9, url: '/js/ueditor1_2_6_1-utf8-net/net/upload/2024-06-30/642d16d0-c340-4e02-9958-5a1edda9ae5b.jpg', name: '机器视觉' },
];

const OUT = path.join(__dirname, '..', 'src', 'images', 'cases');

function download(url, dest) {
  return new Promise((resolve, reject) => {
    const mod = url.startsWith('https') ? https : http;
    mod.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        // follow redirect
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
  for (const img of images) {
    if (!img.url) {
      console.log(`[跳过] oid=${img.oid} — 无配图`);
      continue;
    }
    const fullUrl = BASE + img.url;
    const ext = path.extname(img.url);
    const dest = path.join(OUT, `case-${img.oid}${ext}`);
    try {
      console.log(`[下载] ${img.name} (oid=${img.oid}): ${fullUrl}`);
      await download(fullUrl, dest);
      const stat = fs.statSync(dest);
      console.log(`  → 完成: case-${img.oid}${ext} (${(stat.size / 1024).toFixed(1)} KB)`);
    } catch (err) {
      console.error(`  ✗ 失败: ${err.message}`);
    }
  }
  console.log('\n全部完成！');
})();
