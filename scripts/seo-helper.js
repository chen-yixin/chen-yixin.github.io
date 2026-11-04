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

  // 修正 JSON-LD 中的图片地址（cover 为协议相对/绝对地址时会被错误拼接）
  html = fixJsonLdImage(html, theme);

  // 统一 OG / Twitter 分享图：小尺寸 favicon 与缩略图换成 1200x630 大图
  html = fixSocialImage(html, theme);

  // 404 页与搜索结果页不应被索引
  html = applyNoindex(html, page);

  // 列表页补充缺失的 H1
  html = injectListH1(html, page, config);

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

// 默认分享大图：使用站内 banner 按 1200x630 裁剪，避免用 128x128 的 favicon
function defaultSocialImage(theme) {
  const banner = (theme.image && theme.image.banner && theme.image.banner.light) || '';
  if (!banner) return null;
  const base = banner.startsWith('//') ? 'https:' + banner : banner;
  return base + (base.includes('?') ? '&' : '?') + 'imageView2/1/w/1200/h/630/format/jpg';
}

// 判断图片是否是过小的 favicon 或 240px 缩略图
function isSmallImage(url) {
  return /favicon\.(png|ico|svg)/.test(url) || /imageView2(?:%2F|\/)0(?:%2F|\/)w(?:%2F|\/)240/.test(url);
}

// 把七牛缩略图参数换成 1200x630 的分享尺寸，并清掉已有的尺寸参数
function toLargeImage(url) {
  const [base] = url.split(/\?(?=imageView2)/);
  const clean = base.split('?')[0];
  if (/img\.hoboro\.top/.test(clean)) {
    return clean + '?imageView2/1/w/1200/h/630/format/jpg';
  }
  return clean;
}

// cover 可能写成 //img.hoboro.top/xxx 或 https://img.hoboro.top/xxx，
// 主题的 JSON-LD 直接做了 full_url_for(page.path + cover)，需要还原成正确地址
function fixJsonLdImage(html, theme) {
  const fallback = defaultSocialImage(theme);
  return html.replace(
    /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g,
    function (match, body) {
      let data;
      try {
        data = JSON.parse(body);
      } catch (e) {
        return match;
      }
      if (!data.image) return match;

      let image = String(data.image);
      // 站点前缀 + img.hoboro.top 的错误拼接
      const broken = image.match(/^https?:\/\/[^/]+\/.*?(img\.hoboro\.top\/.*)$/);
      if (broken) {
        image = 'https://' + broken[1];
      } else if (image.startsWith('//')) {
        image = 'https:' + image;
      }

      if (!image || /favicon\.(png|ico|svg)/.test(image)) {
        if (fallback) image = fallback;
      } else if (isSmallImage(image)) {
        image = toLargeImage(image);
      }

      data.image = image;
      return (
        '<script type="application/ld+json">' +
        JSON.stringify(data) +
        '</script>'
      );
    }
  );
}

function fixSocialImage(html, theme) {
  const fallback = defaultSocialImage(theme);
  return html.replace(
    /<meta (property="og:image"|name="twitter:image") content="([^"]*)"\s*\/?>/g,
    function (match, attr, url) {
      let next = url;
      if (url.startsWith('//')) next = 'https:' + url;
      if (!next || /favicon\.(png|ico|svg)/.test(next)) {
        if (fallback) next = fallback;
      } else if (isSmallImage(next)) {
        next = toLargeImage(next);
      }
      return '<meta ' + attr + ' content="' + next + '">';
    }
  );
}

// 404 页与本地搜索页（纯 JS 空壳）标记为 noindex,follow
function applyNoindex(html, page) {
  const is404 = page.type === '404' || page.path === '404.html';
  const isSearch = /^search\//.test(page.path || '');
  if (!is404 && !isSearch) return html;

  let result = html.replace(
    /<meta name="robots" content="[^"]*"\s*\/?>/,
    '<meta name="robots" content="noindex,follow" />'
  );
  // 无 robots 标签时补一条
  if (result === html) {
    result = html.replace('</title>', '</title>\n<meta name="robots" content="noindex,follow" />');
  }
  return result;
}

// 主题的列表页（首页、分类、标签、归档、分页）没有 H1，补一个仅供搜索引擎与读屏器识别的标题
function injectListH1(html, page, config) {
  if (/<h1[\s>]/i.test(html)) return html;
  if (page.type === '404' || /^search\//.test(page.path || '')) return html;

  let text = '';
  if (page.path === 'index.html') {
    text = config.subtitle ? config.title + ' - ' + config.subtitle : config.title;
  } else if (page.category) {
    text = '分类: ' + page.category;
  } else if (page.tag) {
    text = '标签: ' + page.tag;
  } else if (page.archive) {
    text = '归档';
  } else if (/^page\/\d+\/index\.html$/.test(page.path || '')) {
    // 首页分页（index generator）
    text = config.title;
  }
  if (!text) return html;
  if (page.current && page.current > 1) text += ' - 第 ' + page.current + ' 页';

  const style =
    'position:absolute;width:1px;height:1px;padding:0;margin:-1px;' +
    'overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0;';
  const h1 = '\n<h1 style="' + style + '">' + escapeHtml(text) + '</h1>';

  return html.replace(/<body([^>]*)>/, '<body$1>' + h1);
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
