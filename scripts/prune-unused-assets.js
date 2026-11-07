"use strict";

/**
 * @file 删除主题 source 被复制到 public 后、站点实际并未引用的静态资源。
 *
 * Kratos-Rebirth 会把主题 source 下的 js/、css/、vendors/ 整体复制到站点根目录。
 * 本站通过 vendors.npm_cdn 让页面直接引用 jsDelivr 上的同名资源，这些本地副本
 * 从未出现在页面里，却会随构建产物上传到对象存储、占用 CDN 请求与流量。
 *
 * 实现上同时做两件事：
 * 1. 从 Hexo 路由中移除这些资源，`hexo generate` 写文件阶段就不会再生成；
 * 2. 删除 public 中上一次构建残留的同名目录（after_generate 早于写文件阶段）。
 *
 * 注意：不要修改 node_modules 中的主题文件，本脚本属于项目级定制。
 */

const fs = require("fs");
const path = require("path");

/** 由 jsDelivr 提供、无需本地副本的目录。 */
const UNUSED_DIRS = ["js", "css", "vendors"];
/** 已移除插件遗留的文件（历史构建可能仍在产物中）。 */
const UNUSED_FILES = ["extentions/waline.js", "extentions/waline.css"];

/**
 * 判断路由是否属于未使用的主题静态资源。
 * @param {string} routePath Hexo 路由路径（以 `/` 分隔）
 * @returns {boolean} 是否应移除
 */
const isUnusedRoute = (routePath) =>
  UNUSED_DIRS.some((dir) => routePath.startsWith(`${dir}/`)) ||
  UNUSED_FILES.includes(routePath);

/**
 * 删除文件或目录（不存在时静默跳过）。
 * @param {string} target 绝对路径
 * @returns {boolean} 是否真的删除了内容
 */
const removeIfExists = (target) => {
  if (!fs.existsSync(target)) return false;
  fs.rmSync(target, { recursive: true, force: true });
  return true;
};

hexo.extend.filter.register("after_generate", () => {
  let routeCount = 0;

  for (const routePath of hexo.route.list()) {
    if (isUnusedRoute(routePath)) {
      hexo.route.remove(routePath);
      routeCount += 1;
    }
  }

  const removedDirs = [];
  for (const dir of UNUSED_DIRS) {
    if (removeIfExists(path.join(hexo.public_dir, dir))) {
      removedDirs.push(`${dir}/`);
    }
  }
  for (const file of UNUSED_FILES) {
    if (removeIfExists(path.join(hexo.public_dir, file))) {
      removedDirs.push(file);
    }
  }

  if (routeCount > 0 || removedDirs.length > 0) {
    hexo.log.info(
      `已移除未使用的本地资源副本：路由 ${routeCount} 个` +
        (removedDirs.length > 0 ? `，目录 ${removedDirs.join("、")}` : "")
    );
  }
});
