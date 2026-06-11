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
