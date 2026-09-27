import { defineConfig } from "vitepress"

/**
 * GeWu 软件主页 VitePress 配置
 * 部署到 GitHub Pages: https://li360.github.io/gewu-site/
 */
export default defineConfig({
  title: "GeWu 格物",
  description: "离线优先的个人知识管理桌面应用",
  base: "/gewu-site/",
  lang: "zh-CN",
  lastUpdated: true,
  cleanUrls: true,
  ignoreDeadLinks: true,

  themeConfig: {
    nav: [
      { text: "首页", link: "/" },
      { text: "用户指南", link: "/user-guide/" },
      { text: "插件开发", link: "/plugin-development/quick-start" },
      { text: "核心概念", link: "/concepts" },
      {
        text: "GitHub",
        items: [
          { text: "源码仓库", link: "https://github.com/li360/gewu-project" },
          { text: "下载安装包", link: "https://github.com/li360/gewu-project/releases" },
          { text: "问题反馈", link: "https://github.com/li360/gewu-project/issues" },
        ],
      },
    ],

    sidebar: {
      "/user-guide/": [
        {
          text: "用户指南",
          items: [{ text: "使用说明", link: "/user-guide/" }],
        },
      ],
      "/plugin-development/": [
        {
          text: "插件开发",
          items: [
            { text: "快速开始", link: "/plugin-development/quick-start" },
            { text: "开发指南", link: "/plugin-development/" },
            { text: "Manifest 规范", link: "/plugin-development/manifest" },
            { text: "API 参考", link: "/plugin-development/api-reference" },
            { text: "打包规范", link: "/plugin-development/packaging" },
            { text: "主题开发", link: "/plugin-development/themes" },
            { text: "国际化", link: "/plugin-development/i18n" },
          ],
        },
      ],
    },

    socialLinks: [{ icon: "github", link: "https://github.com/li360/gewu-project" }],

    editLink: {
      pattern: "https://github.com/li360/gewu-site/edit/main/docs/:path",
      text: "在 GitHub 上编辑此页",
    },

    footer: {
      message: "基于 Tauri 2 + React 18 构建",
      copyright: "Copyright © GeWu Team",
    },

    outline: {
      label: "本页目录",
    },
    docFooter: {
      prev: "上一页",
      next: "下一页",
    },
    lastUpdatedText: "最后更新",
    returnToTopLabel: "返回顶部",
    sidebarMenuLabel: "菜单",
    darkModeSwitchLabel: "外观",
  },
})
