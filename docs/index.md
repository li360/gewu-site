---
layout: home

hero:
  name: GeWu 格物
  text: 离线优先的个人知识管理
  tagline: 文件系统即存储 · 插件驱动 UI · 主题随心换 · 本地数据永不离手
  actions:
    - theme: brand
      text: 下载 Windows 内测版
      link: https://github.com/li360/gewu-project/releases/tag/beta-channel
    - theme: alt
      text: 快速入门
      link: /user-guide/
    - theme: alt
      text: 开发插件
      link: /plugin-development/quick-start

features:
  - icon: 🗂️
    title: 文件系统即存储
    details: 知识库存储在真实文件夹中，任何更改都能被同步、备份，甚至用其他编辑器查看。不锁定你的数据。
  - icon: 🧩
    title: 插件驱动界面
    details: 界面由可装卸的插件容器组成，从文件列表到 Markdown 编辑器皆可替换。URL 一键安装，支持自更新。
  - icon: 🎨
    title: 主题插件系统
    details: 纯 CSS 即可开发主题插件，无需编写 JavaScript。内置 5 套主题，支持社区主题热切换。
  - icon: 📦
    title: 离线优先
    details: 所有数据存储在本地 SQLite 数据库，无需联网即可使用。支持 Windows 桌面端。
  - icon: 🔌
    title: 容器化布局
    details: 多容器并排、拖拽调整宽度、最大化、折叠，按需组织工作区。命令面板快速触达所有功能。
  - icon: 🛠️
    title: 开发者友好
    details: TypeScript 协议包 + 类型安全 API，quick-start 指南端到端可复制执行，AI 助手也能直接上手。
---

::: warning 当前处于 Beta 内测阶段
GeWu 目前为 **v0.30.0 内测版**，功能仍在快速迭代，可能存在缺陷与破坏性调整。

- **下载**：请从 [beta 通道 Release 页面](https://github.com/li360/gewu-project/releases/tag/beta-channel) 获取安装包，应用内自动更新也走 beta 通道
- **反馈**：遇到问题欢迎到 [GitHub Issues](https://github.com/li360/gewu-project/issues) 提交，你的反馈将直接决定正式版的形态
:::

## 三分钟体验

```powershell
# 1. 打开 beta 通道 Release 页面，下载最新 GeWu_x.x.x_x64-setup.exe 并安装
# 2. 创建第一个知识库（选择任意文件夹）
# 3. 拖拽文件进去，或点击「扫描」导入现有目录
```

想改个主题？试试社区主题插件：

```powershell
# 在插件管理 → URL 安装，粘贴：
# https://github.com/li360/plugin-theme-midnight
```

## 关于开源

GeWu 目前处于内测阶段，**暂未开源**。插件开发文档与协议规范已先行公开，欢迎基于文档开发主题与功能插件；待产品稳定后会评估开源计划。

<style>
/* 缩小首页 hero 副标题字号，避免中等宽度下频繁换行 */
.VPHero .text {
  font-size: clamp(1.7rem, 3.8vw, 2.7rem);
  line-height: 1.25;
}
.VPHero .tagline {
  font-size: clamp(0.95rem, 1.6vw, 1.15rem);
}
@media (max-width: 640px) {
  .VPHero .text {
    font-size: 1.5rem;
  }
}
</style>
