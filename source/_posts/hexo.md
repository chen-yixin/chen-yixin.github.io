---
title: Hello World!
date: 2020-10-24 00:00:00
updated: 2026-05-24 00:00:00
categories: Hexo
tags:
  - hexo
sticky: 1
#cover:
comments: true
toc: true
---

欢迎使用 `Kratos : Rebirth` 这个我们精心打造的 Hexo 主题！希望能在接下来的旅途中与您相伴，共同创造出更多难以忘怀的美好体验。

本文汇总了 Hexo 博客框架的安装、配置、写作与部署流程，可作为日常参考手册。

<!-- more -->

## Hexo 简介

[Hexo](https://hexo.io/zh-cn/) 是一个快速、简洁且高效的静态博客框架，基于 Node.js 构建。使用 Markdown 撰写文章，Hexo 能在几秒内生成完整的静态网站。

**核心特性：**

- 闪电般的生成速度，数百篇文章也能秒级生成
- 支持 Markdown 和多种模板引擎（Nunjucks、EJS、Pug 等）
- 一键部署到 GitHub Pages、Vercel、云存储等平台
- 丰富的插件和主题生态

## 安装与初始化

### 前置条件

- Node.js（推荐 LTS 版本）
- Git

### 安装

```bash
npm install -g hexo-cli
```

### 初始化博客

```bash
hexo init my-blog
cd my-blog
npm install
```

初始化后的目录结构：

```
.
├── _config.yml          # 站点配置
├── package.json
├── scaffolds/           # 文章模板
├── source/
│   ├── _drafts/         # 草稿目录
│   └── _posts/          # 文章目录
└── themes/              # 主题目录
```

## 基本命令

`hexo g` 生成静态文件，输出到 `public/` 目录。

```bash
hexo generate   # hexo g
```

`hexo s` 启动本地开发服务器，默认访问 `http://localhost:4000`。

```bash
hexo server     # hexo s
```

`hexo d` 将生成的静态文件部署到远程服务器。

```bash
hexo deploy     # hexo d
```

> 生成 + 部署可以一步完成：`hexo g -d` 或 `hexo d -g`

`hexo clean` 清除缓存文件和已生成的静态文件。

```bash
hexo clean
```

> 当修改了配置文件或页面没有按预期更新时，先执行 `hexo clean` 再重新生成，通常能解决问题。

## 草稿工作流

如果直接使用 `hexo new <title>` 新建文章，会在 `source/_posts/` 下创建，执行 `hexo generate` 时即被编译并输出到 `public/` 目录，后续 `hexo deploy` 则会将未完成的文章一并部署到服务器。

使用草稿机制可以避免以上问题——草稿存放在 `source/_drafts/` 目录，不参与生成和部署。

### 建立草稿

```bash
hexo new draft <title>
```

### 本地预览草稿

```bash
hexo server --draft  # hexo s --draft
```

> 预览草稿时务必加上 `--draft` 参数，否则草稿不会在本地服务器中显示。

### 发布草稿

```bash
hexo publish <title>  # hexo p <title>
```

文章将从 `source/_drafts/` 移动到 `source/_posts/`，转为正式文章。

## 文章 Front-matter

每篇文章顶部使用 YAML 格式编写元数据，Hexo 和主题会根据这些信息处理文章。以下是常用字段：

```yaml
---
title: 文章标题
date: 2020-10-24 00:00:00
categories: 分类名称
tags:
  - 标签1
  - 标签2
sticky: 1 # 置顶
cover: //img.example.com/cover.jpg # 封面图
comments: true # 开启评论
toc: true # 显示目录
donate: true # 开启打赏
share: true # 开启分享
---
```

- `title` 和 `date` 为必填项，其余字段根据主题需求选填
- `categories` 支持层级结构，如 `[技术, 前端]` 表示分类路径为「技术 > 前端」
- 不同主题可能提供额外的 front-matter 字段，具体参考主题文档

## 分类与标签

分类（Categories）和标签（Tags）是 Hexo 中组织文章的核心方式。

**分类：**具有层级结构，一篇文章可属于多个分类。在 `_config.yml` 中可设置 `category_dir` 指定分类页路径。

**标签：**扁平结构，一篇文章可设置多个标签。在 `_config.yml` 中可设置 `tag_dir` 指定标签页路径。

```yaml
categories:
  - 技术
  - Hexo
tags:
  - 博客
  - 教程
```

> 分类会作为 URL 路径的一部分，建议提前规划好分类体系，避免后期频繁修改影响已有链接。

## 文章摘要

在文章中加入 `<!-- more -->` 标记，之前的内容将作为摘要显示在首页和归档列表中，标记后的内容需点击进入全文才能查看。

```markdown
这里是摘要内容，会显示在首页列表中。

<!-- more -->

这里是正文内容，点击「阅读全文」后方可查看。
```

> 合理使用摘要可以让首页信息密度适中，提升读者浏览体验。

## 静态资源

本站已开启文章资源目录功能（`post_asset_folder: true`），新建文章时会自动创建同名资源文件夹，将文章引用的图片等资源放在该文件夹中即可。

引用示例：

```markdown
{% asset_img example.png 图片描述 %}
```

> 使用 `asset_img` 标签插件引用图片，Hexo 会自动处理路径，避免图片链接失效。

也可使用外部图床（如七牛云、OSS），在 front-matter 中通过 `cover` 字段指定封面图：

```yaml
cover: //img.hoboro.top/picgo/example.jpg
```

## Scaffolds（文章模板）

`scaffolds/` 目录下的文件定义了新建文章时使用的模板：

| 模板       | 对应命令         | 用途         |
| ---------- | ---------------- | ------------ |
| `post.md`  | `hexo new`       | 默认文章模板 |
| `draft.md` | `hexo new draft` | 草稿模板     |
| `page.md`  | `hexo new page`  | 独立页面模板 |

可以编辑这些模板文件，添加常用的 front-matter 字段，避免每次手动输入。例如本站的 `scaffolds/post.md` 已经预设了 `comments`、`toc`、`donate`、`share` 等字段。

## 配置文件

Hexo 有两层配置：

**站点配置 `_config.yml`**：控制站点基本信息、URL、目录结构、部署方式等。

```yaml
# 站点信息
title: My Blog
author: 作者名
language: zh-CN

# URL
url: https://example.com
permalink: posts/:title/

# 目录
source_dir: source
public_dir: public

# 写作
new_post_name: :title.md
post_asset_folder: true
```

**主题配置**：通常为 `_config.<theme-name>.yml`，控制导航栏、侧边栏、评论区、CDN 等主题相关设置。本站使用 `Kratos : Rebirth` 主题，配置文件为 `_config.kratos-rebirth.yml`。

## 主题管理

### 安装主题

```bash
# 方式一：Git 克隆
git clone <theme-repo-url> themes/<theme-name>

# 方式二：npm 安装
npm install hexo-theme-<name> --save
```

### 切换主题

修改 `_config.yml` 中的 `theme` 字段：

```yaml
theme: <theme-name>
```

> 切换主题后建议执行 `hexo clean && hexo g` 确保配置生效。

## 部署

Hexo 支持一键部署到多种平台，在 `_config.yml` 中配置 `deploy` 字段即可。

**GitHub Pages：**

```yaml
deploy:
  type: git
  repo: git@github.com:<username>/<username>.github.io.git
  branch: main
```

**七牛云：**

```yaml
deploy:
  type: qiniu
  bucket: <bucket-name>
  accessKey: <ak>
  secretKey: <sk>
```

> 本站通过 GitHub Actions 自动构建并部署到 GitHub Pages 和七牛云，详见 `.github/workflows/build.yml`。本地不再直接执行 `hexo deploy`。

## 常用插件

- **hexo-deployer-git** — 一键部署到 Git 仓库
- **hexo-generator-sitemap** — 生成站点地图，便于搜索引擎收录
- **hexo-generator-feed** — 生成 RSS 订阅源
- **hexo-word-counter** — 文章字数统计与阅读时间估算
- **hexo-filter-mermaid** — 支持 Mermaid 流程图、时序图

```bash
npm install hexo-deployer-git --save
```

## 常见问题

**`hexo generate` 后页面没有更新？**

先执行 `hexo clean` 清除缓存，再重新生成。

**如何修改文章永久链接？**

修改 `_config.yml` 中的 `permalink` 字段。注意修改后旧链接会失效，如需兼容需配置别名或重定向。

**多台设备如何同步写作？**

将站点源文件（不含 `public/`、`node_modules/`）通过 Git 管理。在另一台设备上 `git clone` 后执行 `npm install` 即可恢复环境。`.gitignore` 中应排除 `public/`、`node_modules/`、`.deploy_git/` 等目录。
