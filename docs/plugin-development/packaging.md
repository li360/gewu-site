# 插件打包规范

GeWu 插件必须打包为 **ESM 格式的纯 JS**，不能依赖 JSX 运行时编译。开发者需用 esbuild/rollup 预编译。

## 目录结构

打包后的插件目录结构：

```
plugin-my-tool/                    ← 插件根目录（以 id 命名）
├── manifest.json                  ← 分发元数据
└── index.js                       ← 打包后的 JS（ESM 格式）
```

> **纯 CSS 主题插件例外**：没有 `index.js`，取而代之是一个或多个 `.css` 文件，且 `manifest.json` 中声明 `themes`。详见 [themes.md](./themes.md)。

## 打包要求

### 1. ESM 格式

`index.js` 必须是 ESM 模块，通过 `export default` 导出 `PluginManifest`。

### 2. externals — 依赖共享

> **⚠️ 当前状态**：依赖共享机制（importmap / 全局变量 / asset 协议）正在验证中（R1），以下为暂定规范，可能调整。

插件打包时**必须**将以下依赖作为 externals，不能打包进 `index.js`：

| 依赖 | 说明 |
|------|------|
| `react` | React 核心，由主应用提供 |
| `react-dom` | React DOM，由主应用提供 |
| `plugin-protocol` | 插件协议类型（纯类型，打包时自动剔除） |
| `kmgr-api` | 知识库 API 类型（纯类型，打包时自动剔除） |
| `workspace` | workspace 编排层（纯类型，打包时自动剔除） |

**原因**：如果插件把 React 打包进去，会导致双 React 实例，`useState`/`useEffect` 等 hooks 会全部失败。

### 3. 无 JSX

`index.js` 必须是纯 JS，不能包含 JSX 语法。开发者用 esbuild/rollup 在构建时编译 JSX。

## esbuild 打包示例

### 安装依赖

```bash
npm install --save-dev esbuild
npm install --save react@^18 react-dom@^18
npm install --save plugin-protocol kmgr-api
```

### esbuild 配置

```js
// build.mjs
import { build } from "esbuild"

await build({
  entryPoints: ["src/index.tsx"],
  bundle: true,
  format: "esm",          // ESM 格式
  outfile: "dist/index.js",
  jsx: "automatic",       // 自动导入 React（编译时）
  external: [
    "react",
    "react-dom",
    "react/jsx-runtime",  // jsx-runtime 也要 external
    "plugin-protocol",
    "kmgr-api",
    "workspace",
  ],
  // 纯类型包在打包时会被自动剔除，无需特殊处理
})

console.log("✅ 插件打包完成: dist/index.js")
```

### package.json scripts

```json
{
  "scripts": {
    "build": "node build.mjs",
    "dev": "node build.mjs --watch"
  }
}
```

### 构建产物验证

打包后的 `index.js` 应该：
- ✅ 是 ESM 格式（包含 `export` 语句）
- ✅ 不包含 `react` 的源码（external 了）
- ✅ 不包含 JSX 语法（已编译为 `React.createElement` 或 jsx-runtime 调用）
- ✅ 通过 `export default` 导出 manifest 对象

## 依赖共享机制（待定）

> **R1 验证中**：以下三种方案正在评估，验证完成后会确定最终方案并更新本文档。

| 方案 | 做法 | 状态 |
|------|------|------|
| importmap | 主应用注入 importmap，插件 externals 通过 importmap 解析 | 待验证 |
| 全局变量 | `window.__GEWU__ = { React, workspace, ... }`，插件 external + global | 待验证 |
| asset 协议 | 用 `asset://localhost/...` 加载本地 JS 而非 Blob URL | 待验证 |

## Tauri API 访问

插件可以通过以下方式访问 Tauri API：

```tsx
// 动态导入 Tauri API（运行时可用）
const { invoke } = await import("@tauri-apps/api/core")
await invoke("some_command", { args })
```

> **安全提示**：当前 `withGlobalTauri: true`，插件可直接调用任意 Tauri IPC 命令。后续版本将引入 capabilities 声明和命令白名单机制。

## 完整项目模板

```
plugin-my-tool/
├── src/
│   └── index.tsx          ← 插件源码
├── dist/
│   ├── index.js           ← 打包产物（构建生成）
│   └── manifest.json      ← 复制到 dist（构建脚本处理）
├── build.mjs              ← esbuild 构建脚本
├── package.json
└── tsconfig.json
```

### build.mjs 完整示例

```js
import { build } from "esbuild"
import { copyFile, mkdir } from "node:fs/promises"

await mkdir("dist", { recursive: true })

// 打包 JS
await build({
  entryPoints: ["src/index.tsx"],
  bundle: true,
  format: "esm",
  outfile: "dist/index.js",
  jsx: "automatic",
  external: [
    "react",
    "react-dom",
    "react/jsx-runtime",
    "plugin-protocol",
    "kmgr-api",
    "workspace",
  ],
})

// 复制 manifest.json
await copyFile("manifest.json", "dist/manifest.json")

console.log("✅ 插件打包完成")
```

## 发布与 URL 安装

用户可在「插件管理 → URL 安装」中粘贴三种地址，安装器会自动识别：

| 输入形态 | 示例 | 行为 |
|----------|------|------|
| GitHub 仓库地址 | `https://github.com/<owner>/<repo>` | 按 Release 约定拼接 `releases/latest/download/update.json`，直连失败自动尝试镜像 |
| update.json 直链 | `https://example.com/gewu/my-plugin/update.json` | 直接读取更新清单（也可在 manifest 中写 `updateUrl` 固化） |
| ZIP 直链 | `https://example.com/gewu-plugin.zip` | 直接下载插件包，元数据以包内 `manifest.json` 为准 |

此外用户仍可使用「手动安装」选择本地 ZIP，以及在「已安装」页批量「检查更新」并一键升级。插件数据存储在主程序数据库中，更新/卸载不会丢失。

### 分发包结构

发布物固定为两个文件：

| 文件 | 说明 |
|------|------|
| `gewu-plugin.zip` | 插件包。JS 插件内含 `manifest.json` + `index.js`；纯 CSS 主题插件内含 `manifest.json` + `*.css`。文件位于 ZIP 根目录（或单一根目录） |
| `update.json` | 更新清单，安装/更新时据此发现版本与下载地址 |

`update.json` 字段：

```json
{
  "version": "0.2.0",
  "downloadUrl": "https://github.com/<owner>/<repo>/releases/latest/download/gewu-plugin.zip",
  "checksum": "sha256:ab12…",
  "minAppVersion": "0.29.0",
  "id": "plugin-my-tool",
  "name": "我的工具",
  "description": "一个示例插件",
  "author": "作者名",
  "capabilities": ["kmgr:read"],
  "notes": "本次更新说明"
}
```

仅 `version` 与 `downloadUrl` 必填；提供 `checksum` 时安装前会做 SHA256 校验。

### GitHub Release 发布步骤（零配置）

1. 将插件推送到公开 GitHub 仓库
2. 构建插件包，命名为 `gewu-plugin.zip`（附 `update.json`，`downloadUrl` 指向 Release 的 latest 直链）
3. 发布 Release（保持最新版本带 `latest` 标记），上传两个附件
4. 用户粘贴仓库地址即可安装，后续一键更新

直连失败时客户端按序尝试镜像：`gh-proxy.com`、`gh.llkk.cc` 前缀代理，以及 `kkgithub.com` 域名替换。用户在设置中配置 HTTP 代理后，全部探测与下载请求均会走代理。

### 纯 CSS 主题插件的打包

主题插件无需 esbuild，可直接用系统自带 PowerShell 打包（自动生成 ZIP、SHA256 与 update.json）：

```powershell
.\pack.ps1 -Version 0.2.0 `
  -DownloadUrl "https://github.com/<owner>/<repo>/releases/latest/download/gewu-plugin.zip"
```

详见 [主题插件开发指南](./themes.md) 与示例 [`packages/sample-theme-plugin/`](../../packages/sample-theme-plugin/)。

