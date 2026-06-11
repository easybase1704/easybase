const fs = require('fs');
const path = require('path');

const casesPath = path.join(__dirname, '..', 'src', '_data', 'cases.json');
const productsPath = path.join(__dirname, '..', 'src', '_data', 'products.json');

const data = JSON.parse(fs.readFileSync(casesPath, 'utf-8'));
const products = JSON.parse(fs.readFileSync(productsPath, 'utf-8'));

// Build product lookup: oid -> { slug, name }
const productMap = {};
for (const p of products.products) {
  productMap[p.oid] = { name: p.name, slug: p.slug || '' };
}

// 老网站各方案详情页的"相关产品"（old product id → 产品名）
const relatedByCase = {
  1: [1, 6, 8],       // 智慧教育: BV10/12/16, V12, B16
  2: [1, 12, 6],      // 智慧办公: BV10/12/16, B25, V12
  3: [15, 14, 11],    // 智慧园区: EB16, E85, B18
  4: [15, 14, 11],    // 智慧零售: EB16, E85, B18
  6: [12, 32, 22],    // 智慧交通: B25, GS-T211, EPC-610-W6/H6
  7: [33, 11, 32],    // 智慧医疗: BV65, B18, GS-T211
  8: [22, 14, 11],    // 智能制造: EPC-610-W6/H6, E85, B18
  9: [34, 14, 11],    // 机器视觉: BV1L-N, E85, B18
};

for (const sol of data.solutions) {
  const ids = relatedByCase[sol.oid];
  if (!ids) {
    console.log(`[跳过] ${sol.name} — 无相关产品`);
    continue;
  }

  sol.relatedProducts = ids.map(oid => {
    const prod = productMap[oid];
    if (!prod) {
      console.log(`  ⚠ 未找到产品 oid=${oid}`);
      return null;
    }
    return { name: prod.name, slug: prod.slug };
  }).filter(Boolean);

  console.log(`[相关产品] ${sol.name}: ${sol.relatedProducts.map(p => p.name).join(', ')}`);
}

fs.writeFileSync(casesPath, JSON.stringify(data, null, 2), 'utf-8');
console.log('\n写入完成: ' + casesPath);
