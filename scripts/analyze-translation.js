const fs = require('fs');
const path = require('path');

const data = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'src', '_data', 'products.json'), 'utf-8'));

// 收集所有需要翻译的文本
const duibiSet = new Set();
const htmlTextSet = new Set();

for (const product of data.products) {
  if (product.duibi && product.duibi.trim()) {
    duibiSet.add(product.duibi.trim());
  }

  // 从 yiwaibao 和 lifekit 提取文本
  for (const field of ['yiwaibao', 'lifekit']) {
    if (!product[field]) continue;
    const matches = product[field].matchAll(/>([^<]+)</g);
    for (const m of matches) {
      const text = m[1].trim();
      if (text && /[一-鿿]/.test(text) && text.length >= 2) {
        htmlTextSet.add(text);
      }
    }
  }
}

console.log('=== 翻译文本统计 ===');
console.log('duibi 唯一文本:', duibiSet.size);
console.log('规格表/亮点 唯一文本:', htmlTextSet.size);
console.log('总计唯一文本:', duibiSet.size + htmlTextSet.size);

// 估算字符数
const allTexts = [...duibiSet, ...htmlTextSet];
const totalChars = allTexts.reduce((sum, t) => sum + t.length, 0);
console.log('总字符数:', totalChars);
console.log('平均每段:', Math.round(totalChars / allTexts.length), '字符');

// 打印一些样例
console.log('\n=== duibi 样例 ===');
[...duibiSet].slice(0, 10).forEach(t => console.log('  -', t));

console.log('\n=== HTML 文本样例 ===');
[...htmlTextSet].slice(0, 20).forEach(t => console.log('  -', t));
