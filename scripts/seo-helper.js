hexo.extend.filter.register('after_render:html', function (str, data) {
  const page = data.page || {};
  const config = hexo.config;
  const theme = hexo.theme.config;

  let html = str;

  // Inject site verification meta tags
  html = injectVerificationTags(html, theme);

  // Fix homepage/article:tag issue - remove article:tag from non-post pages
  html = fixArticleTags(html, page);

  // Fix Twitter card for pages with images -> summary_large_image
  html = fixTwitterCard(html, page);

  // Add sitemap link if not already present
  html = addSitemapLink(html, config);

  return html;
});

function injectVerificationTags(html, theme) {
  const seo = theme.seo || {};
  let tags = '';
  if (seo.google_site_verification) {
    tags += '\n<meta name="google-site-verification" content="' + seo.google_site_verification + '" />';
  }
  if (seo.bing_site_verification) {
    tags += '\n<meta name="msvalidate.01" content="' + seo.bing_site_verification + '" />';
  }
  if (seo.baidu_site_verification) {
    tags += '\n<meta name="baidu-site-verification" content="' + seo.baidu_site_verification + '" />';
  }
  if (tags) {
    html = html.replace('<meta name="robots"', tags + '\n<meta name="robots"');
  }
  return html;
}

// Non-post pages (homepage, archive, tag, category) should not have article:tag meta
function fixArticleTags(html, page) {
  const isPost = page.__post === true || (page.layout === 'post');
  if (isPost) return html;
  // Match both /> and > closing styles
  return html.replace(/\n?<meta property="article:tag"[^>]*\/?>/g, '');
}

// Use summary_large_image when og:image is present
function fixTwitterCard(html, page) {
  if (html.includes('og:image') && html.includes('<meta name="twitter:card" content="summary">')) {
    html = html.replace(
      '<meta name="twitter:card" content="summary">',
      '<meta name="twitter:card" content="summary_large_image">'
    );
  }
  return html;
}

// Add sitemap link to head for search engine discovery
function addSitemapLink(html, config) {
  if (html.includes('rel="sitemap"')) return html;
  var sitemapUrl = config.url.replace(/\/$/, '') + '/sitemap.xml';
  var link = '\n<link rel="sitemap" type="application/xml" title="Sitemap" href="' + sitemapUrl + '" />';
  return html.replace('<link rel="canonical"', link + '\n<link rel="canonical"');
}
