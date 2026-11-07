# AGENTS.md

## 项目概述

个人 Hexo 博客（中文/zh-CN），在线地址 `https://www.hoboro.top`。基于 **Kratos:Rebirth** v3.0.1 主题，包管理器为 pnpm v9。面向读者的功能与写作说明见 `README.md`，本文只记录 agent 需要遵守的决策与约束。

## 常用命令

| 命令 | 说明 |
|---|---|
| `pnpm run server` | 本地开发服务器（端口 4000，热重载） |
| `pnpm run build` | `hexo generate`，生成静态站点到 `public/`（不带 `--force`） |
| `npx hexo generate --force` | 强制全量重建，CI 与改动自检使用 |
| `pnpm run clean` | 删除 `public/`、`db.json` 与 Hexo 缓存 |
| `pnpm install --frozen-lockfile` | 安装依赖（**必须**使用此形式，不要只用 `pnpm install`） |
| `npx hexo new "文章标题"` | 新建文章（模板 `scaffolds/post.md`） |
| `npx hexo new draft "草稿标题"` | 新建草稿（模板 `scaffolds/draft.md`） |
| `npx hexo publish "草稿标题"` | 草稿转为正式文章 |

项目**没有** lint、test、typecheck 脚本，改动后的自检方式见「关键约定 8」。

## 项目架构

```
├── AGENTS.md                    # 本文件（agent 约定）
├── README.md                    # 面向读者的项目说明
├── _config.yml                  # Hexo 主配置（站点、URL、渲染器、插件、feed、sitemap）
├── _config.kratos-rebirth.yml   # 主题配置（导航、侧栏、评论、CDN、分享、打赏、注入）
├── package.json                 # 依赖与 npm scripts
├── scaffolds/                   # post / draft / page 模板
├── scripts/                     # 自定义 Hexo 脚本（seo-helper.js）
├── skills/                      # ClawHub 技能商店安装的技能
├── .claude/                     # 项目技能与 sub-agent（hexo-post-writer / blog-writer）
├── source/
│   ├── _posts/                  # 文章（Markdown，按分类分子目录）
│   ├── _data/                   # Hexo 数据文件（linklist.yml）
│   ├── assets/                  # 静态资源（favicon 等）
│   ├── extentions/              # 注入脚本（mermaid.js）
│   ├── resume/                  # 简历页面
│   └── robots.txt               # robots 配置
├── sitemap_template.xml         # 自定义 sitemap 模板
├── upload_qiniu.cjs             # 七牛上传与 CDN 刷新脚本（CI 使用）
├── public/                      # 构建输出（gitignored）
└── .github/workflows/build.yml  # CI/CD
```

### 关键架构细节

- **双配置**：`_config.yml` 管 Hexo 核心（站点元信息、URL、渲染器、插件、feed/sitemap），`_config.kratos-rebirth.yml` 管主题表现（导航、侧栏、评论、分享、打赏、CDN、额外注入）。展示层改动优先落在后者。
- **静态资源分流**：主题自身 JS/CSS 与第三方依赖（nprogress、viewerjs、qr-code-styling、font-awesome）通过 `vendors.npm_cdn` 指向 jsDelivr；图片（`img.hoboro.top`）、站点 HTML 与 `/extentions` 自建脚本由七牛分发。
- **自定义注入**：`source/extentions/mermaid.js` 经主题 `additional_injections` 注入每个页面；同一段配置还从 unpkg 引入 Mermaid 运行时。
- **seo-helper.js**：在 `after_render:html` 阶段统一做 SEO 后处理——站点验证 meta、非文章页移除 `article:tag`、`twitter:card` 升级、sitemap link、JSON-LD 图片修正、OG/Twitter 图统一为 1200×630、404 与搜索页 noindex、列表页补 H1。
- **评论**：未启用（原 Waline 评论与浏览量统计已移除），主题 `comments` / `visit_count` 保持空配置。

## 关键约定

1. **包管理**：仅 pnpm v9，lockfile 为 v9.0 格式；项目依赖禁止 npm / yarn。CI 中的 `npm install qiniu glob` 只是上传脚本的临时工具依赖，不违反此约定。
2. **部署**：`deploy.type` 为空，**不要**执行 `hexo deploy` 或 `pnpm run deploy`；实际部署由 CI 完成，构建固定使用 `npx hexo generate --force`。
3. **主题定制边界**：不要修改 `node_modules/hexo-theme-kratos-rebirth`（升级即丢失）。主题层改动一律通过 `scripts/seo-helper.js`、`_config.kratos-rebirth.yml` 的 `additional_injections` 或 `source/extentions/` 实现。
4. **固定链接**：全局格式为 `posts/:title/`，修改会破坏所有已有链接；部分文章在 frontmatter 用 `permalink` 覆盖（如 anime 分类）。改文件名不影响 URL，改 `permalink` 会断链。
5. **Front-matter**：字段见 `scaffolds/post.md` 与 README；新文章必须写 `description`（每页 SEO 描述），`keywords` 可选。
6. **SEO 是易碎配置**：`pretty_urls.trailing_index: false`（canonical 为 `/xxx/`）、feed 只输出摘要（`content: false`、`limit: 10`）、`/404.html` 与 `/search/` 为 noindex、列表页 H1 由脚本注入（视觉隐藏）、默认分享图为 banner 裁剪的 1200×630。改动这些前先按约定 8 做全站检查。
7. **静态资源**：主题 JS/CSS 与第三方依赖只走 jsDelivr；`scripts/prune-unused-assets.js` 会在生成阶段移除主题 source 复制到 `public/` 的 `js/`、`css/`、`vendors/` 副本，上传脚本也不会再上传这些路径。新增主题依赖或升级主题时调整 `vendors.npm_cdn`，不要把资源改回本站。
8. **自检**：`npx hexo generate --force` 后抽查 `public/`——canonical 与 og:url 不含 `index.html`、og:image 为 1200×630、文章页 `meta description` 非空、引用的外部资源可访问。
9. **换行符**：仓库 `core.autocrlf=true`；用脚本批量改文章时要保留原行尾，否则会产生整文件 diff。
10. **提交信息**：`<emoji> <type>(<scope>): 中文摘要`，正文用 `-` 列表说明改动（与仓库历史一致）。
11. **构建确定性**：`scripts/stabilize-locals.js` 固定 posts/pages/tags/categories 的排序，配合 `index_generator.order_by: -date title`、MathJax `svg.fontCache: none`、`marked.mangle: false` 消除每次构建都会出现的伪变更。新增文章时避免与其他文章使用完全相同的 `date`（同日发布请错开时间）。

## CI/CD

`.github/workflows/build.yml`，push 到 `main` 或提交 PR 时触发：

- **build**：Node latest → pnpm v9 → `pnpm install --frozen-lockfile` → `npx hexo generate --force` → 上传 `public/` 作为 Pages artifact。
- **deploy-github-page**（仅 main）：`actions/deploy-pages@v4` 部署到 GitHub Pages。
- **deploy-qiniu**（仅 main）：下载 artifact → `npm install qiniu glob` → 执行 `upload_qiniu.cjs` 上传增量文件并刷新 CDN。

> 上传脚本按文件大小与七牛 ETag 判断增量（>4MB 自动分片上传，失败自动重试），并清理对象存储中历史遗留的 `js/`、`css/`、`vendors/`、`extentions/waline.*`；刷新 CDN 时每个页面只刷新目录形式（如 `/posts/x/`），不再同时刷新 `index.html`，避免刷新额度翻倍。线上静态资源 `Cache-Control` 为 1 年，改动这些目录需更换版本号或手动刷新。

Dependabot 每天检查 npm 依赖更新（`open-pull-requests-limit: 20`）。

## 主题特性

暗色/亮色主题切换（PJAX）、QQ/微博/X/Facebook 分享、支付宝/微信打赏、Mermaid 图表、highlight.js 代码高亮、RSS/Atom、sitemap 与 baidusitemap、中文注音（hexo-zhruby）、数学公式（hexo-math）、站内搜索。

## 写作

文章写作规范见 `.claude/skills/hexo-post-writer/SKILL.md`；新增文章请补充 `description`，并尽量添加 2~3 条站内互链。
