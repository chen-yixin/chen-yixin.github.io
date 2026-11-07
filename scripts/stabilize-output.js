"use strict";

/**
 * @file 规范化输出中依赖数据库顺序的字段，保证重复构建得到完全一致的产物。
 *
 * Hexo 的 `post.tags` 关联顺序取决于文章写入数据库的先后，每次构建可能不同，
 * 导致 atom.xml 与 search-index.json 中同一篇文章的标签顺序变化，
 * 进而触发无意义的增量上传与 CDN 刷新。
 *
 * 在 after_generate 阶段（写文件之前）重写这两条路由即可，不修改主题文件。
 */

/**
 * 读取路由的完整内容。
 * @param {string} routePath 路由路径
 * @returns {Promise<string|null>} 文本内容，路由不存在时为 null
 */
const readRoute = (routePath) =>
  new Promise((resolve, reject) => {
    const stream = hexo.route.get(routePath);
    if (!stream) {
      resolve(null);
      return;
    }

    const chunks = [];
    stream.on("data", (chunk) => chunks.push(chunk));
    stream.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    stream.on("error", reject);
  });

/**
 * 按码点比较字符串，避免 localeCompare 依赖运行环境的 ICU 数据。
 * @param {string} a 左值
 * @param {string} b 右值
 * @returns {number} 比较结果
 */
const compare = (a, b) => (a < b ? -1 : a > b ? 1 : 0);

/**
 * 提取 search-index 条目的标签名。
 * @param {[string, string]|{name: string}} tag 标签项
 * @returns {string} 标签名
 */
const searchTagName = (tag) =>
  String(Array.isArray(tag) ? tag[0] : tag.name);

/**
 * 按名称排序 search-index.json 中每个条目的 tags。
 * @param {string} json 原始 JSON 文本
 * @returns {string} 规范化后的 JSON 文本
 */
const normalizeSearchIndex = (json) => {
  const data = JSON.parse(json);
  if (!Array.isArray(data)) return json;

  for (const item of data) {
    if (Array.isArray(item.tags) && item.tags.length > 1) {
      item.tags = item.tags
        .slice()
        .sort((a, b) => compare(searchTagName(a), searchTagName(b)));
    }
  }

  return JSON.stringify(data);
};

/**
 * 按 term 排序 atom.xml 中每个 entry 内连续的 `<category />` 行。
 * @param {string} xml 原始 XML 文本
 * @returns {string} 规范化后的 XML 文本
 */
const normalizeAtom = (xml) =>
  xml.replace(/<entry>[\s\S]*?<\/entry>/g, (entry) =>
    entry.replace(/(?:^[ \t]*<category [^>]*\/>[ \t]*\r?\n)+/gm, (block) => {
      const newline = block.includes("\r\n") ? "\r\n" : "\n";
      const lines = block.split(/\r?\n/).filter((line) => line.trim());
      if (lines.length < 2) return block;

      const sorted = lines.slice().sort((a, b) => {
        const termA = (a.match(/term="([^"]*)"/) || [])[1] || "";
        const termB = (b.match(/term="([^"]*)"/) || [])[1] || "";
        return compare(termA, termB);
      });

      return sorted.join(newline) + newline;
    })
  );

hexo.extend.filter.register("after_generate", async () => {
  const searchIndex = await readRoute("search-index.json");
  if (searchIndex) {
    hexo.route.set("search-index.json", normalizeSearchIndex(searchIndex));
  }

  const atom = await readRoute("atom.xml");
  if (atom) {
    hexo.route.set("atom.xml", normalizeAtom(atom));
  }
});
