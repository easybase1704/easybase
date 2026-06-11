const fs = require('fs');
const path = require('path');

function productSlug(name) {
  return name.toLowerCase()
    .replace(/[\/\s]+/g, '-')
    .replace(/[^a-z0-9\-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

// Update products.json with slugs
const productsPath = path.join(__dirname, '..', 'src', '_data', 'products.json');
const products = JSON.parse(fs.readFileSync(productsPath, 'utf-8'));

for (const p of products.products) {
  p.slug = productSlug(p.name);
  console.log(`[product] ${p.name} → ${p.slug}`);
}

fs.writeFileSync(productsPath, JSON.stringify(products, null, 2), 'utf-8');
console.log(`\n写入: ${productsPath}`);

// Rebuild cases.json relatedProducts with correct slugs
const casesPath = path.join(__dirname, '..', 'src', '_data', 'cases.json');
const cases = JSON.parse(fs.readFileSync(casesPath, 'utf-8'));

const productMap = {};
for (const p of products.products) {
  productMap[p.oid] = { name: p.name, slug: p.slug };
}

// Re-apply related product IDs and regenerate slugs
const relatedByCase = {
  1: [1, 6, 8],
  2: [1, 12, 6],
  3: [15, 14, 11],
  4: [15, 14, 11],
  6: [12, 32, 22],
  7: [33, 11, 32],
  8: [22, 14, 11],
  9: [34, 14, 11],
};

for (const sol of cases.solutions) {
  const ids = relatedByCase[sol.oid];
  if (!ids) continue;
  sol.relatedProducts = ids.map(oid => {
    const prod = productMap[oid];
    return prod ? { name: prod.name, slug: prod.slug } : null;
  }).filter(Boolean);
  console.log(`[case] ${sol.name}: ${sol.relatedProducts.map(p => `${p.name}→${p.slug}`).join(', ')}`);
}

fs.writeFileSync(casesPath, JSON.stringify(cases, null, 2), 'utf-8');
console.log(`\n写入: ${casesPath}`);
console.log('完成！');
