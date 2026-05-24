# ほぼろ

[![Build](https://github.com/chen-yixin/chen-yixin.github.io/actions/workflows/build.yml/badge.svg)](https://github.com/chen-yixin/chen-yixin.github.io/actions/workflows/build.yml)

个人博客，基于 [Hexo](https://hexo.io/) + [Kratos:Rebirth](https://github.com/kratos-rebirth/quickstart) 主题构建。

> 在线地址：[https://www.hoboro.top](https://www.hoboro.top)

## 技术栈

- **Hexo** v8 — 静态站点生成器
- **Kratos:Rebirth** v3 — 博客主题
- **pnpm** v9 — 包管理器
- **Waline** — 评论系统（自托管于 `waline.hoboro.top`）
- **Mermaid** — 文章内图表渲染
- **七牛云** — 静态资源 CDN（`img.hoboro.top`）
- **GitHub Actions** — CI/CD 自动部署

## 功能特性

- 暗色/亮色主题切换，PJAX 无刷新加载
- Waline 评论 + 浏览量统计 + 表情包（Bilibili / Bmoji）
- QQ / 微博 / X / Facebook 一键分享
- 支付宝 / 微信打赏
- 文章内 Mermaid 图表
- 代码高亮（highlight.js）
- RSS / Atom 订阅、Sitemap 站点地图
- 中文注音（ruby 标记）

## 本地开发

```sh
# 1. 安装 pnpm（如已安装可跳过）
npm install -g pnpm

# 2. 安装依赖（必须使用 --frozen-lockfile）
pnpm install --frozen-lockfile

# 3. 启动本地预览（http://localhost:4000）
pnpm run server

# 4. 构建静态站点
pnpm run build

# 5. 清理构建缓存
pnpm run clean
```

## 新建文章

```sh
# 创建新文章
npx hexo new "文章标题"

# 创建草稿
npx hexo new draft "草稿标题"

# 发布草稿
npx hexo publish "草稿标题"
```

文章存放在 `source/_posts/` 下，可按分类创建子目录。文章头部 Front-matter 模板见 `scaffolds/post.md`，支持字段：`title`、`date`、`categories`、`tags`、`sticky`、`cover`、`comments`、`toc`、`donate`、`share`。

## 项目结构

```
├── source/
│   ├── _posts/          # 博客文章（Markdown，按分类分子目录）
│   └── extentions/      # 自定义 JS/CSS 注入（Waline、Mermaid 等）
├── _config.yml          # Hexo 主配置
├── _config.kratos-rebirth.yml  # 主题配置（导航、侧栏、评论、CDN 等）
├── scaffolds/           # 文章/页面模板
├── public/              # 构建输出（gitignored）
└── .github/workflows/   # CI/CD 工作流
```

## 部署

Push 到 `main` 分支后 GitHub Actions 自动触发：

1. `build` — 安装依赖 + `hexo generate --force`
2. `deploy-github-page` — 部署到 GitHub Pages
3. `deploy-qiniu` — 同步到七牛云存储并刷新 CDN 缓存

> `_config.yml` 中的 `deploy` 配置为空，实际部署均由 CI 完成，不使用 `hexo deploy`。

## 链接格式

固定链接格式为 `posts/:title/`，修改会破坏所有已有链接，**请勿变更**。

## License

MIT License — 详见源码文件头部声明。
