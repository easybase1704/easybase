const news = require('./news.json');
const langs = [
  { code: 'zh', prefix: '' },
  { code: 'en', prefix: 'en/' },
];

module.exports = function () {
  const entries = [];
  for (const lang of langs) {
    for (const article of news.articles) {
      entries.push({ ...article, langCode: lang.code, langPrefix: lang.prefix });
    }
  }
  return entries;
};
