// 修复产品英文字段中的粘连问题（DDR4Memory → DDR4 Memory 等）
import fs from 'fs';

const data = JSON.parse(fs.readFileSync('src/_data/products.json', 'utf-8'));
const fields = ['duibiEn', 'lifekitEn', 'yiwaibaoEn'];

// 收集所有产品型号（需要保护，防止被 (\d)([A-Z]) 误拆）
const modelNames = new Set();
for (const prod of data.products) {
  // 型号本身
  modelNames.add(prod.name);
  // 型号中的每个片段（处理 P238W6-6780/6540 这种复合型号）
  for (const part of prod.name.split(/[/\-]/)) {
    if (part.length >= 2) modelNames.add(part);
  }
}
// 按长度降序排列，确保长型号先替换
const sortedModels = [...modelNames].sort((a, b) => b.length - a.length);

function fixSpacing(text) {
  if (!text) return text;
  let result = text;
  let counter = 0;

  // ═══ 第0遍：保护产品型号和技术术语 ═══
  const placeholderMap = new Map();

  // 0a: 保护产品型号（避免 BA1AG → BA1 AG）
  for (const model of sortedModels) {
    // 只保护含数字的型号片段（纯字母的不会触发规则误伤）
    if (/\d/.test(model) && /[A-Z]/.test(model)) {
      const ph = `___MODEL${counter}___`;
      placeholderMap.set(ph, model);
      // 用全局替换，但在单词边界匹配
      result = result.replaceAll(model, ph);
      counter++;
    }
  }

  // 0b: 保护会被 [a-z][A-Z] 误拆的技术缩写
  const techTerms = [
    'mSATA', 'eMMC',
    'DDR3L', 'DDR4L', 'DDR5L',
    'LPDDR3', 'LPDDR4', 'LPDDR5',
    'PCIe', 'MiniPCIe', 'mPCIe',
    'NVMe', 'Nvme',
    'SO-DIMM', 'SO DIMM',
  ];
  for (const term of techTerms) {
    const ph = `___TECH${counter}___`;
    placeholderMap.set(ph, term);
    result = result.replaceAll(term, ph);
    counter++;
  }

  // ═══ 第1遍：修复断裂的 HTML 实体 ═══
  result = result.replace(/&nbsp(?!;)/g, '&nbsp;');
  result = result.replace(/&lt(?!;)/g, '&lt;');
  result = result.replace(/&gt(?!;)/g, '&gt;');
  result = result.replace(/&amp(?!;)/g, '&amp;');

  // ═══ 第2遍：+ 号两侧加空格 ═══
  result = result.replace(/([a-zA-Z0-9])\+([a-zA-Z0-9])/g, '$1 + $2');

  // ═══ 第3遍：特殊字符后的粘连 ═══
  // Core™Processor → Core™ Processor
  result = result.replace(/(Core™)([A-Z])/g, '$1 $2');
  result = result.replace(/(Iris®)([A-Z])/g, '$1 $2');
  result = result.replace(/(Arc™)([A-Z])/g, '$1 $2');

  // ═══ 第4遍：通用粘连修复 ═══
  // 4a: 小写→大写边界（MobileProcessor → Mobile Processor）
  result = result.replace(/([a-z])([A-Z])/g, '$1 $2');
  // 4b: 数字→大写边界（DDR4Memory → DDR4 Memory, 2280SSD → 2280 SSD）
  result = result.replace(/(\d)([A-Z])/g, '$1 $2');
  // 4c: 大写缩写→大写单词边界（SATASupports → SATA Supports）
  result = result.replace(/([A-Z])([A-Z][a-z])/g, '$1 $2');

  // ═══ 第5遍：恢复保护的技术术语 ═══
  for (const [ph, term] of placeholderMap) {
    result = result.replaceAll(ph, term);
  }

  // ═══ 第6遍：再次扫描小写→大写粘连 ═══
  // 原因：restore 之后，保护术语可能与相邻单词产生新的粘连
  // 例如：SupportsNvme → restore 后 `sN` 又粘上了
  result = result.replace(/([a-z])([A-Z])/g, '$1 $2');

  // ═══ 第7遍：愈合误拆的型号和术语 ═══
  // 7a: 产品型号（被 (\d)([A-Z]) 或规则误拆）
  for (const model of sortedModels) {
    if (/\d/.test(model) && /[A-Z]/.test(model)) {
      const broken = model.replace(/(\d)([A-Z])/g, '$1 $2');
      if (broken !== model) {
        result = result.replaceAll(broken, model);
      }
    }
  }
  // 7b: 技术术语（被 ([A-Z])([A-Z][a-z]) 误拆）
  result = result.replaceAll('PC Ie', 'PCIe');
  result = result.replaceAll('NV Me', 'NVMe');
  result = result.replaceAll('N VMe', 'NVMe');
  // 7c: eMMC 前面没有空格（OnboardeMMC 等）
  result = result.replace(/([a-z])eMMC/g, '$1 eMMC');

  // ═══ 第8遍：清理多余空格 ═══
  result = result.replace(/ {2,}/g, ' ');
  result = result.replace(/&nbsp; +/g, '&nbsp; ');

  return result;
}

// 应用修复
let fixedCount = 0;
for (const prod of data.products) {
  for (const field of fields) {
    if (prod[field]) {
      const original = prod[field];
      const fixed = fixSpacing(original);
      if (original !== fixed) {
        prod[field] = fixed;
        fixedCount++;
      }
    }
  }
}

console.log(`Fixed ${fixedCount} fields out of ${data.products.length * fields.length}`);

fs.writeFileSync('src/_data/products.json', JSON.stringify(data, null, 2), 'utf-8');
console.log('Written to src/_data/products.json');
