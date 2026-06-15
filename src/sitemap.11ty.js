const products = require("./_data/products.json");
const news = require("./_data/news.json");
const cases = require("./_data/cases.json");

function slug(str) {
  return str.toLowerCase()
    .replace(/[\/\s]+/g, '-')
    .replace(/[^a-z0-9\-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function newsSlug(article) {
  const s = article.title.toLowerCase()
    .replace(/[^一-龥a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 30);
  return `${article.date}-${s}`;
}

function caseSlug(solution) {
  return solution.nameEn.toLowerCase()
    .replace(/[\/\s]+/g, '-')
    .replace(/[^a-z0-9\-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

const today = new Date().toISOString().split('T')[0];
const BASE = 'https://www.easy-base.com.cn';

function url(loc, changefreq, priority, alternates) {
  let xml = `  <url>\n    <loc>${BASE}${loc}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>${changefreq}</changefreq>\n    <priority>${priority}</priority>\n`;
  if (alternates) {
    for (const alt of alternates) {
      xml += `    <xhtml:link rel="alternate" hreflang="${alt.lang}" href="${BASE}${alt.href}" />\n`;
    }
  }
  xml += `  </url>`;
  return xml;
}

const urls = [];

// Static pages - Chinese
const zhStatic = [
  ['/', 'daily', '1.0'],
  ['/products/', 'weekly', '0.9'],
  ['/news/', 'weekly', '0.8'],
  ['/cases/', 'weekly', '0.8'],
  ['/about/', 'monthly', '0.6'],
  ['/support/', 'monthly', '0.6'],
];
for (const [loc, cf, pri] of zhStatic) {
  urls.push(url(loc, cf, pri, [
    { lang: 'zh-Hans', href: loc },
    { lang: 'en', href: '/en' + loc },
  ]));
}

// Static pages - English
const enStatic = ['/products/', '/news/', '/cases/', '/about/', '/support/'];
for (const loc of enStatic) {
  urls.push(url('/en' + loc, 'weekly', '0.7'));
}

// Product pages
for (const p of products.products) {
  const s = slug(p.name);
  urls.push(url(`/products/${s}/`, 'monthly', '0.7'));
  urls.push(url(`/en/products/${s}/`, 'monthly', '0.7'));
}

// News pages
for (const a of news.articles) {
  const s = newsSlug(a);
  urls.push(url(`/news/${s}/`, 'monthly', '0.5'));
  urls.push(url(`/en/news/${s}/`, 'monthly', '0.5'));
}

// Case pages
for (const c of cases.solutions) {
  const s = caseSlug(c);
  urls.push(url(`/cases/${s}/`, 'monthly', '0.5'));
  urls.push(url(`/en/cases/${s}/`, 'monthly', '0.5'));
}

exports.data = {
  permalink: '/sitemap.xml',
  eleventyExcludeFromCollections: true,
};

exports.render = function() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls.join('\n')}
</urlset>`;
};
