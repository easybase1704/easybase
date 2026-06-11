const fs = require('fs');
const path = require('path');

const casesPath = path.join(__dirname, '..', 'src', '_data', 'cases.json');
const data = JSON.parse(fs.readFileSync(casesPath, 'utf-8'));

// 老网站 URL 前缀
const OLD_PREFIX = '/js/ueditor1_2_6_1-utf8-net/net/upload/';

for (const sol of data.solutions) {
  if (!sol.body) continue;

  let replaced = false;
  // 匹配 src="/js/ueditor1_2_6_1-utf8-net/net/upload/.../uuid.jpg"
  const regex = new RegExp(OLD_PREFIX.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '[^"]+', 'g');

  sol.body = sol.body.replace(regex, (match) => {
    replaced = true;
    const ext = path.extname(match);
    return `/images/cases/case-${sol.oid}${ext}`;
  });

  if (replaced) {
    console.log(`[更新] oid=${sol.oid} ${sol.name}`);
    console.log(`  → ${sol.body.substring(0, 120)}...`);
  }
}

fs.writeFileSync(casesPath, JSON.stringify(data, null, 2), 'utf-8');
console.log('\n写入完成: ' + casesPath);
