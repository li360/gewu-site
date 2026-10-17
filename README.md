# GeWu 官网与文档站

GeWu（格物）的公开主页与在线文档，使用 **VitePress** 构建，推送到 `main` 后由 GitHub Actions 发布到 GitHub Pages。

## 环境

- Node.js 18+（CI 使用 24）
- npm

## 本地开发

```powershell
cd E:\GeWu\gewu-site
npm ci
npm run docs:dev          # 默认 http://localhost:5173
```

## 构建与预览

```powershell
npm run docs:build        # 产物：docs/.vitepress/dist
npm run docs:preview      # 本地预览构建产物
```

构建通过是唯一的自动化检查；改完文案务必本地 `docs:dev` 过一遍导航与链接。

## 部署

- 推送 `main` 触发 [.github/workflows/deploy.yml](.github/workflows/deploy.yml)
- Actions 执行 `npm ci` + `npm run docs:build`，用 `actions/deploy-pages` 发布
- 也可在 Actions 页面手动 `workflow_dispatch`

**不需要**手动上传产物；不要提交 `docs/.vitepress/dist`。

## 内容结构

```
docs/
├── index.md                 ← 首页
├── concepts.md              ← 核心概念
├── plugin-development/      ← 插件开发文档（与主仓库 docs/plugin-development 对应）
├── user-guide/              ← 用户指南
└── .vitepress/
    ├── config.mts           ← 导航、侧边栏、站点配置
    └── dist/                ← 构建产物（不提交）
```

## 改动约定

- 新增页面要在 `docs/.vitepress/config.mts` 的侧边栏登记，否则等于没发布
- 功能文案以主仓库当前发布版本为准；未发布功能不要写进用户文档
- 中文为主；代码块用 fenced code，路径用相对链接
