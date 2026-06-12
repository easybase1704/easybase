module.exports = function(eleventyConfig) {
  // Copy static assets
  eleventyConfig.addPassthroughCopy("src/css");
  eleventyConfig.addPassthroughCopy("src/js");
  eleventyConfig.addPassthroughCopy("src/images");
  eleventyConfig.addPassthroughCopy("public");

  // Collections
  eleventyConfig.addCollection("hotProducts", function(collection) {
    const products = require("./src/_data/products.json");
    return products.products.filter(p => p.isHot);
  });

  // Filters
  eleventyConfig.addFilter("getCategory", function(classId) {
    const products = require("./src/_data/products.json");
    for (const cat of products.categories) {
      for (const sub of cat.sub) {
        if (sub.id === classId) return { parent: cat, sub: sub };
      }
    }
    return null;
  });

  eleventyConfig.addFilter("getProductsByCategory", function(products, subId) {
    return products.filter(p => p.classId === subId);
  });

  // Slug filters for URL generation
  eleventyConfig.addFilter("productSlug", function(name) {
    return name.toLowerCase()
      .replace(/[\/\s]+/g, '-')
      .replace(/[^a-z0-9\-]/g, '')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  });

  eleventyConfig.addFilter("articleSlug", function(article) {
    // Use date + oid for unique, clean URLs
    const nameSlug = article.title.toLowerCase()
      .replace(/[^一-龥a-z0-9]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 30);
    return article.date + '-' + nameSlug;
  });

  eleventyConfig.addFilter("caseSlug", function(solution) {
    return solution.nameEn.toLowerCase()
      .replace(/[\/\s]+/g, '-')
      .replace(/[^a-z0-9\-]/g, '')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  });

  // Category thumbnail: first product image from first sub-category
  // Specific overrides for categories where default doesn't fit
  const CATEGORY_THUMB_OVERRIDE = {
    11: 'b18',       // 边缘计算 → B18
    12: 'gs-r266',   // 服务器 → GS-R266
  };
  eleventyConfig.addFilter("getCategoryThumb", function(cat, products) {
    // Check override first
    if (CATEGORY_THUMB_OVERRIDE[cat.id]) {
      return '/images/products/' + CATEGORY_THUMB_OVERRIDE[cat.id] + '-01.png';
    }
    if (!cat.sub || !cat.sub.length) return '';
    const firstSubId = cat.sub[0].id;
    const firstProduct = products.find(p => p.classId === firstSubId);
    if (!firstProduct) return '';
    const slug = firstProduct.name.toLowerCase()
      .replace(/[\/\s]+/g, '-')
      .replace(/[^a-z0-9\-]/g, '')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    return '/images/products/' + slug + '-01.png';
  });

  // Fix asset paths for GitHub Pages subdirectory deployment
  eleventyConfig.addFilter("fixPaths", function(content, basePath) {
    if (!basePath) return content;
    return content
      .replace(/src="\/images\//g, `src="${basePath}/images/`)
      .replace(/src='\/images\//g, `src='${basePath}/images/`)
      .replace(/href="\/images\//g, `href="${basePath}/images/`)
      .replace(/href="\/css\//g, `href="${basePath}/css/`)
      .replace(/href="\/js\//g, `href="${basePath}/js/`);
  });

  return {
    dir: {
      input: "src",
      output: "_site",
      includes: "_includes",
      data: "_data"
    },
    templateFormats: ["njk", "html"],
    htmlTemplateEngine: "njk"
  };
};
