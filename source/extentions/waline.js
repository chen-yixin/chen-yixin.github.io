import {
  init,
  commentCount,
} from "https://unpkg.com/@waline/client@v3/dist/waline.js";
import { pageviewCount } from "https://unpkg.com/@waline/client@v3/dist/pageview.js";

(() => {
  const serverURL = "waline.hoboro.top";
  let firstVisit = true;

  const loadComments = async () => {
    const container = document.getElementById("w-comments");
    if (!!container) {
      // 是文章或页面，完整加载 Waline
      const path = container.getAttribute("data-path");
      init({
        el: container,
        path,
        dark: 'html[data-theme="dark"]',
        serverURL,
        pageview: true,
        comment: true,
        emoji: [
          "https://unpkg.com/@waline/emojis@1.2.0/bilibili",
          "https://unpkg.com/@waline/emojis@1.2.0/bmoji",
        ],
        reaction: false,
        locale: {
          placeholder: "欢迎留言。（填写邮箱，可在被回复时收到邮件提醒）",
        },
      });
    } else {
      // 是首页，只展示页面访问和评论数量，不渲染评论区
      pageviewCount({
        serverURL,
        update: false,
      });
      commentCount({
        serverURL,
      });
    }

    if (firstVisit) {
      // 站点的访问统计，仅生效一次
      firstVisit = false;
      pageviewCount({
        serverURL,
        path: "/index.html",
      });
    }
  };

  window.loadComments = loadComments;
  window.addEventListener("pjax:success", () => {
    window.loadComments = loadComments;
  });
})();
