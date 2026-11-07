"use strict";

/**
 * @file 为 Hexo 的 locals 提供稳定排序，避免每次构建产生无意义的伪变更。
 *
 * 背景：
 * - 内置 post generator 固定按 `-date` 排序，同日期文章的 prev/next 顺序不稳定；
 * - sitemap、搜索索引等插件直接遍历 locals，未显式排序；
 * - 标签云依赖 site.tags 的遍历顺序。
 *
 * 在 before_generate 阶段为这些 Query 指定多字段排序，使同一份源码重复构建
 * 得到完全一致的产物，从而避免无意义的增量上传与 CDN 刷新。
 */

/** locals 名称到排序表达式的映射（空格分隔多字段，`-` 表示降序）。 */
const ORDERS = {
  posts: "-date title",
  pages: "source",
  tags: "name",
  categories: "name",
};

hexo.extend.filter.register("before_generate", () => {
  for (const [name, order] of Object.entries(ORDERS)) {
    const query = hexo.locals.get(name);
    if (!query || typeof query.sort !== "function") continue;
    hexo.locals.set(name, query.sort(order));
  }
});
