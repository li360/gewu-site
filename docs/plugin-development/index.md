# GeWu 插件开发指南

GeWu（格物）是一个基于 Tauri + React 的个人知识管理桌面应用。插件系统是 GeWu 的核心扩展机制，允许第三方开发者为 GeWu 添加新功能。

## 快速导航

| 文档 | 内容 |
|------|------|
| **[快速开始（AI 友好版）](./quick-start.md)** | **新手首选**：端到端可复制执行，含完整 manifest/源码/打包脚本，读完即可产出可安装插件 |
| [manifest 规范](./manifest.md) | `manifest.json` 和 `PluginManifest` 的字段说明 |
| [打包规范](./packaging.md) | 插件 JS 的打包要求、externals 配置、esbuild 示例、URL 安装与发布 |
| [主题插件开发](./themes.md) | 纯 CSS 主题插件（无 JS）：令牌覆盖、`themes` 贡献点、打包发布 |
| [API 参考](./api-reference.md) | `PluginContext`、事件总线、kmgr-api、**多实例过滤契约** 等 |
| [国际化规范](./i18n.md) | 轻量 i18n 方案、键命名、语言文件格式、志愿者翻译流程 |

> **⚠️ 重要**：如果你的插件订阅了 `file:open`、`file:select`、`folder:selected` 等公共事件，**必须**按 [多实例过滤契约](./api-reference.md#多实例事件过滤契约) 使用 `createMultiInstanceFilter`，否则在用户开启多实例时会出现"所有实例同时响应"的 bug。

## 架构概览

```
plugin-protocol/  ← 接口契约（你需依赖的类型包）
    ↑
workspace/        ← 编排层：注册插件、管理槽位、路由事件
    ↑
ui-framework/     ← 渲染层：容器渲染插件组件
    ↑
plugin-*/         ← 你的插件：实现 PluginManifest + PluginComponent
```

**核心通信模型**：事件总线（EventBus）。插件通过 `emit(event, payload)` 发事件，`on(event, handler)` 收事件，workspace 根据配置在容器间路由事件。

## 最小插件示例

```tsx
// src/index.tsx
import { useState } from "react"
import type { PluginManifest, PluginContext } from "plugin-protocol"

function HelloPlugin({ containerId, emit, on }: PluginContext) {
  const [count, setCount] = useState(0)
  return (
    <div style={{ padding: 16 }}>
      <h2>Hello GeWu Plugin</h2>
      <p>容器: {containerId}</p>
      <button onClick={() => setCount((c) => c + 1)}>点击 {count}</button>
    </div>
  )
}

const manifest: PluginManifest = {
  id: "hello-plugin",
  name: "Hello 插件",
  icon: "👋",
  component: HelloPlugin,
  emits: [],
  handles: [],
}

export default manifest
```

## 插件开发流程

1. **创建项目**：`npm init`，安装 `plugin-protocol`、`react` 作为依赖
   （纯 CSS 主题插件不需要任何构建工具，参考 [themes.md](./themes.md)）
2. **编写插件**：实现 `PluginManifest`，导出为 default
3. **打包**：用 esbuild/rollup 打包为 ESM 格式的 `index.js`（React 作为 external）
4. **编写 manifest.json**：填写分发元数据
5. **安装测试**：
   - 本地：放入 `$APP_DATA/plugins/{插件id}/` 目录后重启，或在插件管理中「手动安装」`gewu-plugin.zip`
   - 远程：发布到 GitHub Release 后，通过「URL 安装」粘贴仓库地址安装（见 [打包规范 → 发布与 URL 安装](./packaging.md#发布与-url-安装)）

## 当前状态

- ✅ 插件协议（`plugin-protocol`）已稳定
- ✅ workspace 编排层已完工
- ✅ 本地目录加载、手动 ZIP 安装
- ✅ URL 安装：GitHub 仓库地址 / `update.json` 直链 / ZIP 直链三种形态，自动镜像降级与 HTTP 代理
- ✅ 自更新：`update.json` 检查更新、一键升级（GitHub Release 约定或自定义 `updateUrl`）
- ✅ 纯 CSS 主题插件（无 JS，仅覆盖设计令牌），JS 插件也可混合贡献主题，见 [themes.md](./themes.md)
- 📋 能力化权限强制执行（命令白名单）规划中
- 📋 插件数据存储 API（`readPluginData`/`writePluginData`）规划中
