---
name: hexo-post-writer
description: |
  为 ほぼろ 博客 (hoboro.top) 撰写和编辑 Hexo 文章。当用户需要写新博文、创建技术教程、
  编辑已有文章、或将内容发布到 Hexo 博客时使用此技能。博客使用 Kratos-Rebirth v3 主题。
allowed-tools: Read, Write, Edit, Grep, Glob, Bash, WebFetch, WebSearch
---

# Hexo 博客文章写作技能

本技能用于为 ほぼろ 博客 (hoboro.top) 撰写和编辑文章。博客基于 **Hexo** 框架，使用
**Kratos-Rebirth v3** 主题。

## 项目路径

- 文章目录：`source/_posts/`
- 文章按分类存放于子目录：`source/_posts/command-tools/`、`source/_posts/ai/`、`source/_posts/nas/` 等
- 脚手架（模板）：`scaffolds/post.md`、`scaffolds/draft.md`
- 主题标签插件源码：`node_modules/hexo-theme-kratos-rebirth/scripts/tag-widgets.js`

## Frontmatter 字段参考

每篇文章顶部使用 YAML 格式编写元数据。以下是全部支持的字段。

### 必填

```yaml
---
title: "文章标题"
date: 2026-07-31 12:00:00   # 格式：YYYY-MM-DD HH:mm:ss
---
```

### 常用

```yaml
categories: 分类名              # 单个字符串，层级分类用列表
tags:                           # 扁平标签列表
  - 标签一
  - 标签二
description: >-                 # SEO 描述，技术文章建议填写
  文章的简要概括，一两句话。
keywords:                       # SEO 关键词，技术文章建议填写
  - 关键词1
  - 关键词2
updated: 2026-07-31 00:00:00   # 最后更新时间
```

### Kratos-Rebirth 主题专用

```yaml
sticky: 0                       # 置顶优先级，数字越大越靠前（默认 0）
comments: true                  # 是否开启评论（默认 true）
toc: true                       # 是否显示文章目录（默认 true）
donate: true                    # 是否开启打赏（可选）
share: true                     # 是否开启分享（可选）
cover: //img.hoboro.top/picgo/example.jpg  # 封面图片 URL
only:                           # 限制文章出现位置（可选）
  - home    # 首页
  - category # 分类页
  - tag     # 标签页
```

`only` 字段说明：
- 不设置 = 所有页面均显示
- 只写 `home` = 仅在首页展示
- 设置非关键字（如 `none`）= 完全隐藏文章

### 现有分类速查（优先复用已有分类）

| 分类名称 | 存放目录 | 用途 |
|----------|---------|------|
| 命令行工具 | `command-tools/` | CLI 工具（rclone、git、certbot、iptables 等）|
| AI | `ai/` | AI 工具与教程（OpenCode、Copilot、Skill）|
| NAS | `nas/` | 家庭服务器 / NAS（fnOS、OpenWrt）|
| 教程文档 | `charts/`、`windows/` | 教程与参考文档 |
| 系统服务 | `windows/` | 系统服务配置（SSH、WinRM、RDP）|
| 数据分析 | `fakessh/` | 数据分析项目 |
| 软考 | `ruankao/` | 软考备考笔记 |
| CDA | `cda-level2/` | CDA 认证笔记 |
| 日语歌 | `anime/` | 日语歌曲歌词 |
| 烧菜 | `cook/` | 菜谱 |
| tests | `tests/` | 测试工具（JMeter、Fio）|
| 工具 | `tools/` | 通用工具教程 |
| Hexo | （根目录） | 博客搭建相关 |
| AWS | `aws/` | AWS 认证笔记 |

新建分类时，在 `source/_posts/` 下创建对应的子目录存放文章。

## 标签插件（Tag Plugins）

Kratos-Rebirth 主题内置了以下自定义标签插件。**必须使用这些标签插件替代原始 HTML** 来实现格式化组件。

### alertpanel — 提示面板（最常用）

创建带图标和标题的彩色面板。是使用频率最高的标签插件。

```
{% alertpanel info "面板标题" %}
此处内容支持 **Markdown** 格式。
- 列表项正常使用
- 代码块正常使用
{% endalertpanel %}
```

**五种类型及使用场景：**

| 类型 | 图标 | 颜色 | 适用场景 |
|------|------|------|----------|
| `info` | ℹ️ | 蓝色 | 定义说明、补充信息、概念解释 |
| `warning` | ⚠️ | 黄色 | 注意事项、已知限制、踩坑提醒 |
| `danger` | ❗ | 红色 | 危险操作警告、不可逆操作说明 |
| `success` | ✅ | 绿色 | 最佳实践、推荐做法、正面总结 |
| `primary` | 🔄 | 默认色 | 一般性提示、非紧急通知 |

**写作要点：**
- 面板内容独立成段渲染为 Markdown，内部可自由使用标题、列表、代码块、表格等
- 面板标题应简洁有力，一句话概括面板主题
- 同一篇文章中避免过多 alertpanel（建议不超过 8 个）
- `info` 和 `warning` 是最常用的两种类型

### alertbar — 行内提示横幅

```
{% alertbar warning, 这是一条简短的行内提示信息 %}
```

单行标签（无需闭合），适用于简短的、不需标题的行内提示信息。与 alertpanel 不同，alertbar 没有标题栏，直接展示提示文字。

### collapse — 可折叠区域

```
{% collapse "点击展开" %}
此处为折叠隐藏的内容，支持 **Markdown**。
{% endcollapse %}
```

第二个参数传入 `open` 可让折叠区域默认展开：

```
{% collapse "默认展开的区域" open %}
页面加载时此区域已展开。
{% endcollapse %}
```

**适用场景：** 长代码块、补充材料、答案参考、延伸阅读。

### blur — 模糊隐藏文字

```
{% blur 此处为剧透内容 %}
```

文字默认模糊，鼠标悬停后显示。适用于剧透内容或敏感信息的临时遮挡。

### asset_img — 文章资源图片

```
{% asset_img screenshot.png "可选的图片描述" %}
```

引用文章专属资源文件夹中的图片。需要 `_config.yml` 中开启 `post_asset_folder: true`（本站已启用）。

### linklist — 友情链接列表

```
{% linklist my-links %}
{% linklist my-links random %}
```

需要预先在 `source/_data/linklist/my-links.yml` 中创建对应的数据文件。第二个参数可选 `order`（顺序，默认）或 `random`（随机）。

## 写作规范

### 文章结构

遵循以下六段式结构（由现有文章提炼）：

1. **引入 Hook（1-3 段）**—— 从读者能产生共鸣的痛点切入，或提出"为什么要关心这个"的问题。用自然、对话式的语气，可以列出具体的痛场景。
2. **概览框**—— 紧跟一个 `{% alertpanel info %}` 给出概念定义和关键事实（官网、GitHub Star 数、许可证、版本号等）。
3. **`<!-- more -->`**—— 放在概览框**之后**，确保首页摘要包含引入 + 概览。这是 Hexo 的摘要截断标记，之前的内容会呈现在首页列表，之后的内容需点击「阅读全文」才能查看。
4. **分步正文**—— 用 `##` 标注主要章节，`###` 标注子章节。横向对比优先用表格，操作步骤优先用有序列表。
5. **实战场景**—— 给出完整的、可复制运行的示例。先展示命令/配置，再解释每一部分的作用。
6. **小结**—— 以 `## 小结` 结尾。精炼总结，可以是编号列表或一段原则概括。小结中不应引入任何新信息。

### 代码块

始终标注语言类型：

````markdown
```bash
rclone sync /local remote: --dry-run -v
```

```yaml
key: value
```

```json
{ "key": "value" }
```
````

行内代码用单个反引号包裹：`rclone copy`、`--dry-run`。

### 表格

横向对比和选项说明优先使用表格：

```markdown
| 参数 | 说明 | 示例 |
|------|------|------|
| `--flag` | 参数作用 | `value` |
```

表格标题行与分隔行之间不要遗漏，列对齐不做强制要求。

### 标题层级

- `##` 用于主要章节（渲染为 H2）
- `###` 用于子章节（渲染为 H3）
- 严禁使用 `#`（H1）—— 文章标题已占 H1
- 标题应简洁、信息量大，避免冗长

### 语气与文风

- 使用自然的口语化中文（简体中文）
- 以"你"称呼读者
- 技术内容准确但不生硬——解释专业术语
- 段落短小精悍，句长有变化
- `**加粗**` 仅用于强调关键词，控制使用频率
- 避免堆砌形容词，用事实和示例说话

### SEO

技术文章必须在 frontmatter 中填写 `description` 和 `keywords`：
- `description`：1-2 句话概括文章价值，包含主要关键词
- `keywords`：包含工具名、中文译名、核心概念、使用场景标签

## 工作流

### 新建文章

1. **确定分类**—— 匹配已有分类；如果没有合适的则建议新建子目录
2. **查重**—— 用 `Glob source/_posts/**/关键词*.md` 检查是否已有相关文章，避免内容重复，同时发现可以互链的机会
3. **调研**—— 使用 `WebSearch` 和 `WebFetch` 获取准确的最新信息。**绝不编造命令、参数、版本号**
4. **撰写**—— 遵循上述结构规范，将文件存放于 `source/_posts/<子目录>/<slug>.md`
5. **善用标签插件**—— 提示信息用 `alertpanel`，对比用表格，命令用代码块

### 编辑已有文章

1. 先用 `Read` 读取文件内容
2. 使用 `Edit` 做精确修改，仅在全文重写时使用 `Write`
3. 保留已有 frontmatter，仅在必要时修改
4. 做实质性修改后更新 `updated` 字段

## Hexo 命令速查

```bash
hexo new post "标题"              # 基于 scaffold 创建新文章
hexo new draft "标题"             # 创建草稿（存入 source/_drafts/）
hexo publish "标题"               # 将草稿发布为正式文章
hexo server                       # 启动本地开发服务器 http://localhost:4000
hexo server --draft               # 本地预览草稿
hexo generate                     # 构建静态站点到 public/
hexo clean                        # 清除缓存（public/ + db.json）
hexo clean && hexo generate       # 配置变更后完整重建
```

## 主题参考信息

- 主题：[Candinya/Kratos-Rebirth](https://github.com/Candinya/Kratos-Rebirth)（v3）
- 官方文档：[wiki.krt.moe](https://wiki.krt.moe/)
- 周边生态：[eco.krt.moe](https://eco.krt.moe/)
- 主题授权：GPL v3

主题特性：
- 支持亮色/暗色双主题切换
- 卡片式首页布局
- 全文搜索
- 多种评论系统（Disqus、Valine、Twikoo、Waline、Gitalk 等）
- 模块化插件架构（V3 起评论、音乐播放器等生态插件不再内置，需按需引入）