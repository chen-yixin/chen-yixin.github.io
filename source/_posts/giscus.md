---
title: 为 Hexo 博客接入 giscus 评论系统
description: "在 Kratos:Rebirth 主题的 Hexo 博客上接入 giscus：GitHub Discussions 准备、giscus.app 参数生成、PJAX 重新挂载、暗色主题同步与文章页评论数。"
date: 2026-11-07 00:30:00
categories: Hexo
tags:
  - giscus
  - 评论系统
  - GitHub
  - Hexo
keywords:
  - giscus
  - Hexo 评论系统
  - GitHub Discussions
  - Kratos-Rebirth
  - 静态博客评论
comments: true
toc: true
donate: true
share: true
---

静态博客最麻烦的部件之一就是评论：既想收到读者反馈，又不想为它维护服务器、数据库和反垃圾服务。giscus 把评论存进 GitHub Discussions，访客用 GitHub 账号登录，站点侧只需要一段脚本。

这篇记录一下我在 Kratos:Rebirth 主题上接入 giscus 的完整过程，包括 GitHub 侧准备、PJAX 重新挂载、暗色主题同步和文章页评论数。

{% alertpanel info "giscus 是什么" %}
giscus 是一个基于 **GitHub Discussions** 的评论系统。评论以 discussion 的形式存放在你指定的公开仓库中，不需要数据库和后端服务；访客用 GitHub 账号授权后即可评论。

- 官网与配置生成器：<https://giscus.app/zh-CN>
- 开源仓库：<https://github.com/giscus/giscus>
- 许可证：MIT
{% endalertpanel %}

<!-- more -->

## 为什么选 giscus

在换成 giscus 之前，我比较过几种常见的静态博客评论方案：

| 方案 | 存储 | 需要自建服务 | 前端密钥 | 备注 |
|------|------|--------------|----------|------|
| Waline | 自托管后端 + 数据库 | 需要 | 无 | 功能完整，但要维护服务器 |
| Gitment | GitHub Issues | 需要 OAuth 代理 | `client_secret` 公开 | 官方代理已失效，项目停更 |
| Gitalk 1.x | GitHub Issues | 需要 CORS 代理 | `client_secret` 公开 | 需逐页初始化 issue |
| Gitalk 2.0 | GitHub Discussions | 需要 token proxy | 无 | 仍是 beta，需自建 Worker |
| giscus | GitHub Discussions | **不需要** | **无** | GitHub App 托管，自动建 discussion |

giscus 的取舍也很明确：

{% alertpanel warning "评论者需要 GitHub 账号" %}
giscus 没有匿名评论，访客必须登录 GitHub 并授权 giscus app。如果你的读者以非技术用户为主，这一点需要提前考虑。
{% endalertpanel %}

## 在 GitHub 上准备

### 开启 Discussions

打开存放评论的仓库，进入 **Settings → General → Features**，勾选 **Discussions**。

仓库必须是公开的，否则访客无法读取 discussion。

### 安装 giscus App

打开 <https://github.com/apps/giscus>，点击 **Install**，选择 **Only select repositories**，只勾选用于存放评论的仓库。

它申请的权限只有两项：

| 权限 | 用途 |
|------|------|
| Metadata: Read | 读取仓库基本信息 |
| Discussions: Read and write | 查找、创建 discussion，代访客发布评论 |

### 新建 Comments 分类

进入仓库的 **Discussions** 标签，点分类栏右侧的编辑按钮，新建一个分类：

- **Name**：`Comments`
- **Format**：**Announcements**

选择 Announcements 是因为该类型下只有仓库维护者和 giscus app 能创建 discussion，普通访客无法在仓库里乱建。分类名和 ID 后面会用到。

### 双域名怎么办

如果站点同时绑定多个域名（例如 `www.example.com` 和 `example.github.io`），giscus 侧不需要额外配置。只要映射方式用 `pathname`，两个域名看到的都是同一套 discussion。

## 生成 giscus 配置

打开 <https://giscus.app/zh-CN>，按下表填写：

| 字段 | 推荐值 | 说明 |
|------|--------|------|
| 仓库 | `owner/repo` | 必须已安装 giscus app 并开启 Discussions |
| 页面 ↔ discussion 映射 | `pathname` | 与域名无关，多域名共享评论 |
| 严格标题匹配 | `0` | 标题重复风险低时无需开启 |
| Discussion 分类 | `Comments` | 前面创建的 Announcements 分类 |
| 语言 | 简体中文 | 对应 `data-lang="zh-CN"` |
| 主题 | `preferred_color_scheme` | 先跟随系统，后面再按站点主题动态切换 |

页面会生成一段类似下面的代码，其中 `data-repo-id` 和 `data-category-id` 是后面必须用到的两个值：

```html
<script src="https://giscus.app/client.js"
        data-repo="owner/repo"
        data-repo-id="R_kgDOxxxxxx"
        data-category="Comments"
        data-category-id="DIC_kwDOxxxxxx"
        data-mapping="pathname"
        data-strict="0"
        data-reactions-enabled="1"
        data-emit-metadata="1"
        data-input-position="bottom"
        data-theme="preferred_color_scheme"
        data-lang="zh-CN"
        crossorigin="anonymous"
        async>
</script>
```

先记下 `data-repo-id` 和 `data-category-id`，接下来接入主题。

## 接入 Kratos:Rebirth

Kratos:Rebirth 的评论系统通过主题配置的 `comments.core` 注入模板，配合 `additional_injections` 加载脚本。主题在 V3 之后不再内置具体评论实现，需要自己接。

Hexo 的 Front-matter、分类与部署流程可以看 [Hexo 博客手册](/posts/hexo/)。

### 注册评论区容器

在 `_config.kratos-rebirth.yml` 中启用评论，并放置容器：

```yaml
comments:
  core:
    enable_at:
      - post
      - page
    template:
      _shared: ""
      index: ""
      post: <div id="giscus-container" class="giscus kr-comments"></div>
      page: <div id="giscus-container" class="giscus kr-comments lazy-load"></div>
```

三个细节：

- **`.giscus`**：giscus 的 `client.js` 会查找这个类的元素，并把 iframe 挂进去；容器的 `id` 会作为 iframe 的 `origin` 参数，用于和父页面通信。
- **`.kr-comments`**：主题的评论区样式。
- **`.lazy-load`**：主题会用 `IntersectionObserver` 延迟加载评论，适合独立页面。文章页这里**故意去掉**了 `lazy-load`，让 iframe 在页面打开时就请求，评论数才能尽早回传。

`page.comments` 必须为 `true`（文章模板默认如此），否则主题不会渲染评论区。

### 注入初始化脚本

继续在 `_config.kratos-rebirth.yml` 的 `additional_injections` 中引入本地脚本：

```yaml
additional_injections:
  after_footer: |
    <script src="/extentions/giscus.js"></script>
```

主题注入的另一个例子是 [Mermaid 图表渲染](/posts/charts/mermaid/)，思路相同：脚本放到 `source/extentions/`，再由主题统一注入每个页面。

### 编写初始化脚本

新建 `source/extentions/giscus.js`：

```javascript
(() => {
  const GISCUS = {
    repo: "owner/repo",
    repoId: "R_kgDOxxxxxx",
    category: "Comments",
    categoryId: "DIC_kwDOxxxxxx",
    mapping: "pathname",
    strict: "0",
    reactionsEnabled: "1",
    emitMetadata: "1",
    inputPosition: "bottom",
    lang: "zh-CN",
  };

  // 与主题的 data-theme 保持一致：null 表示跟随系统。
  const currentTheme = () => {
    const theme = document.documentElement.getAttribute("data-theme");
    if (theme === "dark") return "dark";
    if (theme === "light") return "light";
    return "preferred_color_scheme";
  };

  // 主题切换时通知 iframe。
  const syncTheme = () => {
    const frame = document.querySelector(".giscus-frame");
    if (frame && frame.contentWindow) {
      frame.contentWindow.postMessage(
        { giscus: { setConfig: { theme: currentTheme() } } },
        "https://giscus.app",
      );
    }
  };

  const loadComments = () => {
    const container = document.getElementById("giscus-container");
    if (!container) return;
    if (container.querySelector(".giscus-frame")) return;

    // PJAX 切换页面后重新挂载，先清掉上一次的 client.js。
    document
      .querySelectorAll("script[data-giscus-client]")
      .forEach((script) => script.remove());

    const script = document.createElement("script");
    script.src = "https://giscus.app/client.js";
    script.async = true;
    script.crossOrigin = "anonymous";
    script.dataset.giscusClient = "true";
    Object.assign(script.dataset, GISCUS, { theme: currentTheme() });
    document.body.appendChild(script);
  };

  new MutationObserver(syncTheme).observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme"],
  });

  window.loadComments = loadComments;
  window.addEventListener("pjax:success", () => {
    window.loadComments = loadComments;
  });
})();
```

脚本里有三处和主题的约定：

1. **PJAX 重新挂载**：Kratos:Rebirth 的 PJAX 在页面切换完成后会重新查找 `.kr-comments`，并调用 `window.loadComments`；所以在 `pjax:success` 时要把函数重新挂回去。
2. **避免重复执行**：每次挂载前移除带 `data-giscus-client` 标记的旧 script，防止 `client.js` 被重复执行。
3. **主题同步**：监听 `documentElement` 的 `data-theme` 变化，把 `dark` / `light` / `preferred_color_scheme` 通过 `postMessage` 发给 giscus iframe。

`Object.assign(script.dataset, GISCUS, ...)` 会把对象里的驼峰键自动映射成 `data-*` 属性，例如 `repoId` → `data-repo-id`、`emitMetadata` → `data-emit-metadata`。

## 显示文章页评论数

giscus 在 `emitMetadata=1` 时，会向父页面推送 discussion 的元数据。消息格式是：

```json
{
  "giscus": {
    "discussion": {
      "totalCommentCount": 5
    }
  }
}
```

### 配置主题评论数

在 `_config.kratos-rebirth.yml` 中启用文章页评论数模板：

```yaml
comments:
  count:
    enable_at:
      - post
    template:
      _shared: '<span class="giscus-comment-count">0</span>'
      index: ""
      post: ""
```

主题的中文文案是 `%s 条评论`，所以页面上会显示「0 条评论」，收到元数据后自动更新。

### 监听元数据

在 `giscus.js` 中加入消息监听：

```javascript
const updateCommentCount = (count) => {
  document.querySelectorAll(".giscus-comment-count").forEach((el) => {
    el.textContent = String(count);
  });
};

window.addEventListener("message", (event) => {
  if (event.origin !== "https://giscus.app") return;

  const discussion = event.data?.giscus?.discussion;
  if (!discussion || typeof discussion.totalCommentCount !== "number") return;

  updateCommentCount(discussion.totalCommentCount);
});
```

{% alertpanel warning "为什么有些文章一直显示 0" %}
giscus 只在对应 discussion 已经存在时才推送元数据。对于还没有任何评论的文章，discussion 尚未创建，页面会保持初始的「0 条评论」；等第一位访客发表评论、discussion 创建之后，再加载页面就会显示真实数量。
{% endalertpanel %}

另外，如果文章页保留了 `lazy-load`，评论区要滚动到可视区域才会加载，元数据自然也会延后。这就是上面文章页容器去掉 `lazy-load` 的原因。

## 常见问题

| 现象 | 排查方向 |
|------|----------|
| 评论区空白或提示未安装 | 仓库是否公开、Discussions 是否开启、giscus app 是否安装到该仓库 |
| 分类不存在或无法创建 discussion | 分类名/ID 是否与 giscus.app 中一致，格式是否为 Announcements |
| 暗色主题不同步 | 站点是否通过 `html[data-theme]` 切换主题，`postMessage` 是否发往 `https://giscus.app` |
| PJAX 切换后评论区消失 | 是否在 `pjax:success` 时重新赋值 `window.loadComments` |
| 评论数不更新 | `emitMetadata` 是否为 `1`，discussion 是否已创建 |
| 两个域名评论不互通 | 映射是否用了 `pathname`，不要用 `url` 或 `title` |

还有一点值得提前决定：discussion 的标题和映射依赖页面路径。本站固定链接是 `posts/:title/`，改文件名或 `permalink` 会让旧评论失去关联，迁移前要权衡。

GitHub 仓库操作不熟的话，可以先看 [Git 常用命令](/posts/command-tools/git/)。

## 小结

1. giscus 用 GitHub Discussions 存评论，不需要数据库和后端，代价是访客必须有 GitHub 账号。
2. GitHub 侧三件事：仓库开启 Discussions、安装 giscus app、创建 Announcements 类型的分类。
3. 映射方式选 `pathname`，多域名共享评论，改固定链接会断评论。
4. 主题侧通过 `comments.core` 放容器、`additional_injections` 引脚本，并在 `pjax:success` 时重新挂载。
5. 评论数依赖 `emitMetadata=1` 和 `totalCommentCount` 消息；没有 discussion 的文章会保持 0。
6. 暗色主题通过 `postMessage` 的 `setConfig` 同步，不需要重新加载 iframe。
