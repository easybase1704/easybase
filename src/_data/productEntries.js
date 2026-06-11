const products = require('./products.json');
const langs = [
  { code: 'zh', prefix: '' },
  { code: 'en', prefix: 'en/' },
];

module.exports = function () {
  const entries = [];
  for (const lang of langs) {
    for (const product of products.products) {
      entries.push({ ...product, langCode: lang.code, langPrefix: lang.prefix });
    }
  }
  return entries;
};
