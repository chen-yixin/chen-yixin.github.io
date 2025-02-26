(() => {
  // 初始化函数
  const init = () => {
    if (typeof mermaid === "undefined") {
      // 重试
      setTimeout(init, 200);
    } else {
      // 开始初始化
      mermaid.initialize({
        theme: "dark", // 这里可以根据自己的需要调整成自己想要的主题
      });
    }
  };

  // 页面更新时的重载函数
  const reload = () => {
    mermaid.init(undefined, ".mermaid");
  };

  // 加载时初始化一次
  init();

  // 在 PJAX 之后重载
  window.addEventListener("pjax:complete", reload);
})();
