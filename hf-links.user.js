// ==UserScript==
// @name            HF 镜像跳转
// @name:en         HF Mirror Redirect
// @namespace       https://github.com/zhzLuke96/hf-links
// @version         v1.4
// @description     在 Hugging Face 仓库页面添加镜像跳转按钮
// @description:en  Add mirror redirect buttons on Hugging Face repository pages.
// @author          zhzluke96
// @match           https://huggingface.co/*
// @icon            https://www.google.com/s2/favicons?sz=64&domain=huggingface.co
// @grant           none
// @license         MIT
// @updateURL       https://github.com/zhzLuke96/hf-links/raw/main/hf-links.user.js
// @downloadURL     https://github.com/zhzLuke96/hf-links/raw/main/hf-links.user.js
// @supportURL      https://github.com/zhzLuke96/hf-links/issues
// ==/UserScript==

(function () {
  "use strict";

  const exit = (message, code = 0) =>
    console.log(`[hf-links|${code}] ${message}`);

  /**
   * @type {typeof document.querySelector}
   */
  const $ = document.querySelector.bind(document);

  const $header = $(
    "body > div > main > div.SVELTE_HYDRATER.contents > header > div > h1"
  );
  if (!$header) {
    exit("没找到header");
    return;
  }

  const frag = document.createDocumentFragment();
  const div = document.createElement("div");
  frag.appendChild(div);

  const build = (html) => {
    div.innerHTML = html;
    const elem = div.firstElementChild;
    div.innerHTML = "";
    return elem;
  };

  const Button = ({ text, icon, onClick }) => {
    const elem = build(`
  <div
    class="inline-flex items-center overflow-hidden whitespace-nowrap rounded-md border bg-white text-sm leading-none text-gray-500 mr-2 shadow"
  >
    <button
      class="relative flex items-center overflow-hidden from-red-50 to-transparent dark:from-red-900 px-1.5 py-1 hover:bg-gradient-to-t focus:outline-none"
      title="${text}"
    >
      <small
        class="left-1.5 absolute"
      >${icon}</small>
      <span class="ml-4 pl-0.5">${text}</span>
    </button>
  </div>
  
      `);
    onClick && elem.addEventListener("click", onClick);
    return elem;
  };

  const parse_hf_repo = () => {
    {
      // 有可能是 datasets
      const match = location.pathname.match(/^\/datasets\/([^/]+)\/([^/]+)/);
      if (match) {
        return {
          kind: "datasets",
          repo_owner: match[1],
          repo_name: match[2],
          pathname: `/datasets/${match[1]}/${match[2]}`,
        };
      }
    }

    // 从 URL 中解析仓库名和所有者
    const match = location.pathname.match(/^\/([^/]+)\/([^/]+)/);
    if (match) {
      return {
        kind: "models",
        repo_owner: match[1],
        repo_name: match[2],
        pathname: `/${match[1]}/${match[2]}`,
      };
    }
    return {};
  };

  const { pathname, repo_name } = parse_hf_repo();

  if (!pathname || !repo_name) {
    exit("解析repo名字失败");
    return;
  }

  const buttons = [
    {
      href: `https://hf-mirror.com${pathname}`,
      label: "hf-mirror",
      icon: "🤗",
    },
    {
      // NOTE: 只搜索 repo name 因为一般都是搬运， owner 不一样
      href: `https://modelscope.cn/search?search=${encodeURIComponent(
        `${repo_name}`
      )}`,
      label: "model-scope",
      icon: "👾",
    },
  ];

  /**
   * ============================
   * 🧠 Portal Root（核心改动）
   * ============================
   */

  const portalRoot = document.createElement("div");
  portalRoot.style.position = "absolute";
  portalRoot.style.top = "0";
  portalRoot.style.left = "0";
  portalRoot.style.zIndex = "9999";
  portalRoot.style.pointerEvents = "none"; // 让容器不挡点击
  document.body.appendChild(portalRoot);

  const container = document.createElement("div");
  container.style.display = "flex";
  container.style.gap = "6px";
  container.style.position = "absolute";
  container.style.pointerEvents = "auto"; // 子元素可点击
  portalRoot.appendChild(container);

  /**
   * ============================
   * 📍 定位逻辑（模拟 anchor）
   * ============================
   */

  const updatePosition = () => {
    if (!$header || !document.body.contains($header)) return;

    // 找到最后一个div
    const last_div = Array.from($header.querySelectorAll(":scope > div")).pop();

    const rect = last_div.getBoundingClientRect();

    container.style.top = `${window.scrollY + rect.top}px`;
    container.style.left = `${window.scrollX + rect.right + 8}px`;
  };

  /**
   * ============================
   * 🔘 创建按钮（不再插入 header）
   * ============================
   */

  for (const button of buttons) {
    const node = Button({
      link: button.href,
      text: button.label,
      icon: button.icon,
      onClick: () => {
        const nw = window.open(button.href, "_blank", "noopener,noreferrer");
        if (nw) nw.opener = null;
      },
    });

    container.appendChild(node);
  }

  /**
   * ============================
   * 🔄 同步位置（替代原 interval hack）
   * ============================
   */

  const loop = () => {
    updatePosition();
    requestAnimationFrame(loop);
  };

  loop();

  /**
   * 额外：scroll / resize 兜底（防止某些情况下 RAF 不触发）
   */
  window.addEventListener("scroll", updatePosition, { passive: true });
  window.addEventListener("resize", updatePosition);

  exit("按钮添加成功（portal 模式）");
})();
