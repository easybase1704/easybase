const site = require('./site-base.json');

// 生产环境（GitHub Pages）需要 /easybase 子目录前缀
// 本地开发不变
site.basePath = process.env.BASE_PATH || '';

module.exports = site;
