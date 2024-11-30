// ==UserScript==
// @name            HF 镜像跳转
// @name:en         HF Mirror Redirect
// @namespace       https://github.com/zhzLuke96/hf-links/hf-links
// @version         v1.0
// @description     在 Hugging Face 仓库页面添加镜像跳转按钮
// @description:en  Add mirror redirect buttons on Hugging Face repository pages.
// @author          zhzluke96
// @match           https://huggingface.co/*
// @icon            https://www.google.com/s2/favicons?sz=64&domain=huggingface.co
// @grant           none
// @license         MIT
// @updateURL       https://github.com/zhzLuke96/hf-links/hf-links/raw/main/hf-links.user.js
// @downloadURL     https://github.com/zhzLuke96/hf-links/hf-links/raw/main/hf-links.user.js
// @supportURL      https://github.com/zhzLuke96/hf-links/hf-links/issues
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
    class="inline-flex items-center overflow-hidden whitespace-nowrap rounded-md border bg-white text-sm leading-none text-gray-500 mr-2"
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
    // 从 URL 中解析仓库名和所有者
    const match = location.pathname.match(/^\/([^/]+)\/([^/]+)/);
    if (match) {
      return {
        repo_owner: match[1],
        repo_name: match[2],
      };
    }
    return {};
  };

  const { repo_owner, repo_name } = parse_hf_repo();

  if (!repo_name || !repo_owner) {
    exit("解析repo名字失败");
    return;
  }

  const buttons = [
    {
      href: `https://hf-mirror.com/${repo_owner}/${repo_name}`,
      label: "hf-mirror",
      icon: "🤗",
    },
    {
      href: `https://modelscope.cn/search?search=${encodeURIComponent(
        `${repo_owner}/${repo_name}`
      )}`,
      label: "model-scope",
      icon: "👾",
    },
  ];

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
    $header.appendChild(node);
  }

  exit("按钮添加成功");
})();