const cases = require('./cases.json');
const langs = [
  { code: 'zh', prefix: '' },
  { code: 'en', prefix: 'en/' },
];

module.exports = function () {
  const entries = [];
  for (const lang of langs) {
    for (const sol of cases.solutions) {
      entries.push({ ...sol, langCode: lang.code, langPrefix: lang.prefix });
    }
  }
  return entries;
};
