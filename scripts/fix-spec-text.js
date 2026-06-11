const fs = require('fs');
const path = require('path');

const PRODUCTS_PATH = path.join(__dirname, '..', 'src', '_data', 'products.json');
const data = JSON.parse(fs.readFileSync(PRODUCTS_PATH, 'utf-8'));

let fixCount = 0;

for (const prod of data.products) {
  let changed = false;
  const fields = ['yiwaibao', 'lifekit'];

  for (const field of fields) {
    if (!prod[field]) continue;
    let html = prod[field];

    // 循环处理：三重以上重复（如"接口接口接口"→ 一次替换后还剩"接口接口"）
    while (html.includes('接口接口')) {
      html = html.replace(/接口接口/g, '接口');
      changed = true;
    }

    while (html.includes('插槽插槽')) {
      html = html.replace(/插槽插槽/g, '插槽');
      changed = true;
    }

    // lifekit 末尾多余闭合标签
    if (field === 'lifekit' && html.includes('</div></div></div>')) {
      html = html.replace(/<\/div><\/div><\/div><\/div>\s*$/, '');
      changed = true;
    }

    prod[field] = html;
  }

  if (changed) {
    fixCount++;
    console.log(`已修复: ${prod.name} (oid=${prod.oid})`);
  }
}

fs.writeFileSync(PRODUCTS_PATH, JSON.stringify(data, null, 2), 'utf-8');
console.log(`\n共修复 ${fixCount} 个产品`);
