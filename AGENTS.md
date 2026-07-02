# AGENTS.md

## 项目概述

个人 Hexo 博客（中文/zh-CN），在线地址 `https://www.hoboro.top`。基于 **Kratos:Rebirth** v3.x 主题构建，使用 pnpm v9 作为包管理器。

## 常用命令

| 命令 | 说明 |
|---|---|
| `pnpm run server` | 启动本地开发服务器（端口 4000，热重载） |
| `pnpm run build` | 生成静态站点到 `public/` |
| `pnpm run clean` | 删除 `public/` 和 Hexo 缓存 |
| `pnpm install --frozen-lockfile` | 安装依赖（**必须**使用此命令，不要只用 `pnpm install`） |
| `npx hexo new "文章标题"` | 创建新文章（使用 `scaffolds/post.md` 模板） |
| `npx hexo new draft "草稿标题"` | 创建草稿（使用 `scaffolds/draft.md` 模板） |
| `npx hexo publish "草稿标题"` | 将草稿发布为正式文章 |

本项目**没有** lint、test、typecheck 脚本。CI 使用 `npx hexo generate --force` 构建。

## 项目架构

```
├── _config.yml                  # Hexo 主配置（站点信息、URL、插件、部署等）
├── _config.kratos-rebirth.yml   # 主题配置（导航、侧栏、评论、CDN、分享、打赏等）
├── scaffolds/                   # 文章/页面模板（post.md, draft.md, page.md）
├── scripts/                     # 自定义 Hexo 脚本（SEO helper）
├── skills/                      # Claude Code 自定义技能
├── source/
│   ├── _posts/                  # 博客文章（Markdown，按分类分子目录）
│   ├── _data/                   # Hexo 数据文件（linklist.yml）
│   ├── assets/                  # 静态资源（favicon 等）
│   ├── extentions/              # 自定义 JS/CSS 注入（Waline 评论、Mermaid 图表）
│   ├── resume/                  # 简历页面
│   └── robots.txt               # SEO robots 配置
├── public/                      # 构建输出（gitignored）
├── upload_qiniu.cjs             # 七牛云上传脚本（CI 使用）
├── sitemap_template.xml         # 自定义 Sitemap 模板
└── .github/
    ├── workflows/build.yml       # CI/CD 工作流
    └── dependabot.yml            # 依赖自动更新配置
```

### 关键架构细节

- **源内容**：`source/_posts/` 下存放 Markdown 文章，使用 Hexo frontmatter。文章可按分类（anime、nas、cook 等）创建子目录组织。
- **双配置文件**：`_config.yml` 管 Hexo 核心（站点元信息、URL、渲染器、插件），`_config.kratos-rebirth.yml` 管主题表现（导航、侧栏小组件、评论系统、分享、打赏、CDN 链接、Footer 等）。主题配置文件非常庞大，大部分展示层配置都在这里。
- **自定义注入**：`source/extentions/` 包含三个文件，通过主题的 `additional_injections` 机制注入到每个页面：
  - `waline.js` / `waline.css` — Waline 评论系统（自托管于 `waline.hoboro.top`）
  - `mermaid.js` — Mermaid 图表渲染
- **CDN**：所有图片和静态资源托管在七牛云（`img.hoboro.top`），上传脚本为 `upload_qiniu.cjs`。
- **评论系统**：Waline 自托管，支持评论、浏览量统计和表情包（Bilibili / Bmoji）。
- **自定义脚本**：`scripts/seo-helper.js` 在 `after_render:html` 阶段注入 SEO 优化标签（站点验证 meta、Twitter Card 升级、sitemap link 等）。
- **自定义技能**：`skills/hexo-blog-with-seo/` 提供了 Claude Code 博客文章写作技能，支持草稿创建和带 SEO 优化的发布流程。

## CI/CD

工作流文件：`.github/workflows/build.yml`

### 触发条件
- Push 到 `main` 分支
- Pull Request

### Job：build
1. 设置 Node.js 环境（latest）
2. 安装 pnpm v9
3. `pnpm install --frozen-lockfile`
4. `npx hexo generate --force`
5. 上传 `public/` 作为 Pages artifact

### Job：deploy-github-page（仅 main 分支）
- 依赖 `build` 完成
- 使用 `actions/deploy-pages@v4` 部署到 GitHub Pages

### Job：deploy-qiniu（仅 main 分支）
- 依赖 `build` 完成
- 下载 build artifact
- 安装 `qiniu` 和 `glob` npm 包
- 执行 `upload_qiniu.cjs` 上传到七牛云对象存储并刷新 CDN 缓存

Dependabot 每天检查 npm 依赖更新。

## 关键约定

1. **包管理器**：仅使用 pnpm v9。lockfile 是 `pnpm-lock.yaml` v9.0 格式。禁止使用 npm 或 yarn。
2. **安装依赖**：始终使用 `pnpm install --frozen-lockfile`，不要直接 `pnpm install`。
3. **CI 构建使用 `--force`**：`hexo generate --force` 即使缓存认为没有变化也会重新生成，确保输出完整。
4. **不使用 `hexo deploy`**：`_config.yml` 中的 `deploy` 配置为空。实际部署完全由 CI 完成。
5. **固定链接格式**：`posts/:title/` — **修改此格式会破坏所有已有链接，请勿变更**。
6. **文章 Front-matter** 支持字段：`title`、`date`、`categories`、`tags`、`description`、`keywords`、`sticky`（置顶）、`cover`（封面图）、`comments`、`toc`、`donate`、`share`。参考 `scaffolds/post.md` 模板。
7. **文章存放**：文章内容写 `source/_posts/`，表现层修改变更 `_config.kratos-rebirth.yml`。
8. **语言与时区**：站点语言 `zh-CN`，时区 `Asia/Shanghai`。
9. **语法高亮**：使用 highlight.js，`_config.yml` 中 `syntax_highlighter: highlight.js`，Mermaid 代码块被排除在高亮之外以避免冲突。
10. **Post Asset Folder**：`post_asset_folder: true`，每篇文章可以有同名资源目录存放图片等附件。

## 主题特性

- 暗色/亮色主题切换，PJAX 无刷新页面加载
- Waline 评论 + 浏览量统计
- QQ / 微博 / X / Facebook 一键分享
- 支付宝 / 微信打赏
- Mermaid 图表支持（代码块标记为 `mermaid`）
- RSS/Atom 订阅（`/atom.xml`）
- Sitemap 站点地图（`/sitemap.xml`、`/baidusitemap.xml`）
- 中文注音（ruby 标记，hexo-zhruby）
- 数学公式渲染（hexo-math）
- 百度主动推送 SEO
