# API 参考

本文档描述插件可用的所有 API。

## PluginContext

每个插件组件都会收到 `PluginContext` 作为 props：

```tsx
import type { PluginContext } from "plugin-protocol"

function MyPlugin(ctx: PluginContext) {
  // ctx.containerId  — 所属容器 ID
  // ctx.emit         — 发出事件
  // ctx.on           — 订阅事件
  // ctx.kmgr         — 知识库 API（可选，Tauri 环境可用）
  // ctx.editor       — 编辑器上下文（可选，仅 isEditor 插件）
}
```

### containerId

```ts
containerId: string
```

插件所属容器的 ID，如 `"c1"`、`"c4"`。

### emit

```ts
emit: <T = unknown>(event: string, payload: T) => void
```

发出事件到事件总线。其他插件可通过 `on` 订阅。

```tsx
ctx.emit("file:select", { path: "/foo/bar.md", name: "bar.md", ext: ".md" })
```

### on

```ts
on: <T = unknown>(event: string, handler: (payload: T) => void) => () => void
```

订阅事件，返回取消订阅函数。

```tsx
useEffect(() => {
  const unsub = ctx.on("file:open", (file) => {
    console.log("打开文件:", file.path)
  })
  return unsub  // 组件卸载时取消订阅
}, [ctx])
```

## 多实例事件过滤契约

### 背景

GeWu 支持同一类型容器存在最多 2 个实例（如两个文件列表、两个编辑器），用于内容比较、复制等场景：

- **Shift + 点击**：打开第二个实例（若已存在则刷新其内容）
- **普通点击**：仅更新第一个实例

为支持此能力，事件总线引入了三个内部字段（属于 `RoutedPayload` 接口），插件无需自己设置，但**订阅事件时必须按规则过滤**：

| 字段 | 注入方 | 含义 |
|------|--------|------|
| `openIn` | 源插件 emit 时携带（可选） | `"new"` 表示请求新开实例；缺省或 `"current"` 走默认路由 |
| `__sourceContainer` | `PluginContext.emit` 自动注入 | 事件来源容器 ID |
| `__targetContainer` | workspace 路由后注入 | 事件最终命中的目标容器 ID |

### 必须使用 `createMultiInstanceFilter`

**任何订阅"会被路由的公共事件"（如 `file:open`、`file:select`、`folder:selected`）的插件，都必须用 `createMultiInstanceFilter` 过滤**，否则当用户开启多实例时，所有实例都会响应同一事件，导致内容错乱。

```tsx
import type { RoutedPayload } from "plugin-protocol"
import { createMultiInstanceFilter } from "plugin-protocol"

function MyViewer({ containerId, on }: PluginContext) {
  useEffect(() => {
    const shouldHandle = createMultiInstanceFilter(containerId)
    const unsub = on("file:open", (payload: unknown) => {
      const p = payload as { path: string; name: string; ext: string } & RoutedPayload
      if (!shouldHandle(p)) return  // ← 关键：非目标实例直接返回
      // ... 业务逻辑
    })
    return unsub
  }, [on, containerId])  // ← 注意 containerId 须入依赖
}
```

### 过滤规则

| 场景 | `__targetContainer` | `openIn` | 原生实例（如 c4） | 动态实例（如 c4#2） |
|------|---------------------|----------|-------------------|---------------------|
| 路由事件已到达 | 有值 | — | 仅当等于自身 ID 时响应 | 仅当等于自身 ID 时响应 |
| 原始事件未路由 | 无 | `"new"` | **忽略**（等路由后再来） | **忽略** |
| 原始事件未路由 | 无 | 缺省/`"current"` | 响应 | **忽略** |

### 自定义事件

插件自定义的**私有事件**（不会被 workspace 路由的）**不需要**调用 `createMultiInstanceFilter`，直接 `on` 即可。判断标准：事件名是否出现在某个 `EventLink.fromEvent`/`toEvent` 中。

### kmgr

```ts
kmgr?: KmgrApi
```

知识库 API，仅在 Tauri 环境中可用。插件需声明 `capabilities: ["kmgr:read"]` 或 `["kmgr:write"]`。

> **当前状态**：workspace 通过 `setKmgrApi()` 全局注入，`ctx.kmgr` 对所有插件可见。后续版本将根据 capabilities 声明控制访问。

API 详细说明见 [kmgr-api/API_SPEC.md](../../packages/kmgr-api/API_SPEC.md)。

### editor

```ts
editor?: EditorFileContext
```

编辑器上下文，仅 `isEditor: true` 的插件可用。

```ts
interface EditorFileContext {
  file: { path: string; name: string; ext: string; content: string } | null
  save: (content: string) => Promise<void>
  markDirty: (dirty: boolean) => void
  isDirty: boolean
  isTauri: boolean
}
```

## 核心事件

插件可通过事件总线通信。以下是核心事件：

### 文件相关

| 事件 | 载荷 | 说明 |
|------|------|------|
| `file:select` | `{ path, name, ext }` | 文件被选中 |
| `file:open` | `{ path, name, ext, content? }` | 打开文件 |

### 库相关

| 事件 | 载荷 | 说明 |
|------|------|------|
| `library:selected` | `{ libraryId, libraryName }` | 选择知识库 |
| `folder:selected` | `{ folderId, folderPath }` | 选择文件夹 |

### 框架交互

| 事件 | 载荷 | 说明 |
|------|------|------|
| `toast:show` | `{ type, message }` | 显示 Toast 通知 |
| `contextmenu:open` | `{ items, x, y }` | 弹出右键菜单 |
| `dialog:open` | `{ type, title, message, ... }` | 弹出确认/警告弹窗 |
| `overlay:open` | `{ pluginId }` | 打开覆盖层 |
| `overlay:close` | `null` | 关闭覆盖层 |
| `statusbar:update` | `{ id, value }` | 动态更新状态栏项值 |

### Toast 通知示例

```tsx
ctx.emit("toast:show", { type: "success", message: "保存成功" })
ctx.emit("toast:show", { type: "error", message: "保存失败" })
```

## Tauri API

插件可通过动态导入访问 Tauri API：

```tsx
// 调用 Rust IPC 命令
const { invoke } = await import("@tauri-apps/api/core")
const result = await invoke("some_command", { args })

// 使用 Tauri 插件
const { open } = await import("@tauri-apps/plugin-dialog")
const filePath = await open({ filters: [{ name: "Markdown", extensions: ["md"] }] })
```

> **安全提示**：当前插件可调用任意 Tauri IPC 命令。后续版本将引入命令白名单机制。

## 插件数据存储（规划中）

> **⚠️ 待实现**：以下 API 正在设计中（D4 决策），尚未可用。

插件用户数据将通过 kmgr-api 存储到 SQLite，不暴露文件系统：

```tsx
// 规划中的 API（尚未实现）
await ctx.kmgr?.readPluginData("my-plugin", "settings")
await ctx.kmgr?.writePluginData("my-plugin", "settings", { theme: "dark" })
```

数据存储在 SQLite 中，插件更新时天然保留。
