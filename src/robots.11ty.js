exports.data = {
  permalink: '/robots.txt',
  eleventyExcludeFromCollections: true,
};

exports.render = function() {
  return `User-agent: *
Allow: /
Sitemap: https://www.easy-base.com.cn/sitemap.xml`;
};
