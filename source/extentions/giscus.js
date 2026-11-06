(() => {
  // 在 https://giscus.app/zh-CN 选择仓库和分类后，把生成的
  // data-repo-id / data-category-id 填到下面两项即可。
  const GISCUS = {
    repo: "chen-yixin/chen-yixin.github.io",
    repoId: "R_kgDONk_chw",
    category: "Comments",
    categoryId: "DIC_kwDONk_ch84DKiJ7",
    mapping: "pathname",
    strict: "0",
    reactionsEnabled: "1",
    emitMetadata: "0",
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

  // 主题切换时通知 iframe，giscus 会重新渲染成对应配色。
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

    // 尚未回填 giscus.app 生成的 ID 时不加载，避免请求报错。
    if (!GISCUS.repoId || !GISCUS.categoryId) {
      console.warn("[giscus] repoId / categoryId 尚未配置，评论区不会加载。");
      return;
    }

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
