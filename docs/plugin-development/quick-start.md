# 插件快速开始（AI 友好版）

> 本文档是**端到端可复制执行**的最小路径，目标读者包括人类开发者和 AI 编码助手。
> 读完本指南并按步骤操作，你会得到一个**能在 GeWu 中安装并运行**的插件。
> 字段级细节见 [manifest.md](./manifest.md)，打包与发布见 [packaging.md](./packaging.md)，主题插件见 [themes.md](./themes.md)。

---

## 两种插件形态，二选一

| 形态 | 是否需要 JS | 适用场景 | 入口 |
|------|-------------|----------|------|
| **JS 功能插件** | 是 | 添加 UI 面板、编辑器、命令、事件处理 | 一个 `index.js`（ESM）+ `manifest.json` |
| **纯 CSS 主题插件** | 否 | 仅修改外观配色 | 一个 `theme.css` + `manifest.json`（声明 `themes`） |

**不确定选哪个？** 只想改颜色/字体 → 选主题插件；想加界面或逻辑 → 选 JS 插件。

---

## 路径 A：写一个 JS 功能插件

### 第 1 步：创建目录与文件

```
plugin-my-tool/
├── src/
│   └── index.tsx
├── manifest.json
├── build.mjs
├── package.json
└── tsconfig.json
```

### 第 2 步：写 `package.json`

```json
{
  "name": "plugin-my-tool",
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "build": "node build.mjs"
  },
  "dependencies": {
    "plugin-protocol": "file:../MyProj/packages/plugin-protocol",
    "kmgr-api": "file:../MyProj/packages/kmgr-api",
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "devDependencies": {
    "esbuild": "^0.21.0",
    "typescript": "^5.0.0",
    "@types/react": "^18.2.0"
  }
}
```

> `plugin-protocol` 和 `kmgr-api` 是 GeWu 主仓库里的包，本地开发用 `file:` 引用（路径按你克隆 MyProj 的实际位置调整）；发布到 npm 后改成正式版本号即可。这两个包**只含类型**，打包时自动剔除，不会进入产物。

### 第 3 步：写 `tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "outDir": "dist"
  },
  "include": ["src"]
}
```

### 第 4 步：写插件源码 `src/index.tsx`

这是一个最小可运行插件：显示容器 ID、一个计数器按钮，并演示如何用事件总线与其他插件通信。

```tsx
import { useState } from "react"
import type { PluginManifest, PluginContext } from "plugin-protocol"

/**
 * 插件组件 —— 接收 PluginContext，返回 React 元素
 * PluginContext 由 workspace 注入，包含：
 *   - containerId: 当前容器 ID
 *   - emit(event, payload): 发送事件
 *   - on(event, handler): 订阅事件，返回取消订阅函数
 *   - kmgr?: 知识库 API（需在 capabilities 声明 kmgr:read/write）
 *   - pluginData?: 插件数据读写 API（绑定当前插件 ID）
 *   - editor?: 编辑器上下文（仅 isEditor 插件）
 *   - sharedState?: 跨插件共享状态
 */
function MyTool({ containerId, emit, on }: PluginContext) {
  const [count, setCount] = useState(0)

  return (
    <div style={{ padding: 16, fontFamily: "var(--font-sans)" }}>
      <h2>我的工具</h2>
      <p>容器 ID：{containerId}</p>
      <p>计数：{count}</p>
      <button
        onClick={() => {
          setCount((c) => c + 1)
          // 广播一个事件，其他插件可以通过 on("my-tool:count-changed") 接收
          emit("my-tool:count-changed", { count: count + 1 })
        }}
      >
        点我 +1
      </button>
    </div>
  )
}

/**
 * 插件声明 —— 插件的唯一入口，必须 default export
 * 完整字段说明见 manifest.md
 */
const manifest: PluginManifest = {
  id: "plugin-my-tool",
  name: "我的工具",
  icon: "🛠️",
  component: MyTool,
  emits: ["my-tool:count-changed"],
  handles: [],
}

export default manifest
```

### 第 5 步：写 `manifest.json`

```json
{
  "id": "plugin-my-tool",
  "name": "我的工具",
  "version": "0.1.0",
  "description": "一个最小示例插件",
  "author": "你的名字",
  "icon": "🛠️",
  "repository": "https://github.com/your-name/plugin-my-tool",
  "minAppVersion": "0.30.0",
  "capabilities": [],
  "emits": ["my-tool:count-changed"],
  "handles": []
}
```

> `manifest.json` 的 `id` 必须与源码里 `PluginManifest.id` 一致。`emits`/`handles` 是静态声明，workspace 据此做事件路由。

### 第 6 步：写 `build.mjs`（esbuild 打包）

```js
import { build } from "esbuild"
import { copyFile, mkdir } from "node:fs/promises"

await mkdir("dist", { recursive: true })

await build({
  entryPoints: ["src/index.tsx"],
  bundle: true,
  format: "esm",
  outfile: "dist/index.js",
  jsx: "automatic",
  // ⚠️ 关键：这些依赖由主程序提供，绝不能打进 index.js
  // 否则会出现双 React 实例，所有 hooks 失效
  external: [
    "react",
    "react-dom",
    "react/jsx-runtime",
    "plugin-protocol",
    "kmgr-api",
    "workspace",
  ],
})

await copyFile("manifest.json", "dist/manifest.json")
console.log("✅ 打包完成：dist/index.js + dist/manifest.json")
```

### 第 7 步：构建

```bash
npm install
npm run build
```

产物在 `dist/`：
```
dist/
├── index.js       ← ESM 格式，已编译 JSX，无 React 源码
└── manifest.json
```

### 第 8 步：本地安装测试

打开 GeWu → **工具 → 插件管理 → 手动安装**，选择 `dist/` 目录下的两个文件打成的 ZIP（`manifest.json` 和 `index.js` 必须在 ZIP 根目录）。

或直接把 `dist/` 复制到 `%APPDATA%\com.gewu.desktop\plugins\plugin-my-tool\` 后重启应用。

### 第 9 步：发布（可选）

按 [packaging.md → 发布与 URL 安装](./packaging.md#发布与-url-安装) 推到 GitHub Release，用户即可通过「URL 安装」粘贴仓库地址安装。

---

## 路径 B：写一个纯 CSS 主题插件

主题插件**不需要任何构建工具**，只需两个文件。

### 文件结构

```
plugin-theme-mine/
├── manifest.json
└── theme.css
```

### `manifest.json`

```json
{
  "id": "plugin-theme-mine",
  "name": "我的主题",
  "version": "0.1.0",
  "description": "一个示例主题",
  "author": "你的名字",
  "icon": "🎨",
  "repository": "https://github.com/your-name/plugin-theme-mine",
  "minAppVersion": "0.30.0",
  "themes": [
    {
      "id": "mine",
      "name": "我的主题",
      "icon": "🎨",
      "stylesheet": "theme.css"
    }
  ]
}
```

> `themes[].id` 即 `data-theme` 属性值，建议带前缀避免与内置主题（light/dark/colorful/ocean/aurora）冲突。

### `theme.css`

```css
/* 只允许覆盖 design-tokens 的 CSS 变量，不能写选择器外的规则 */
html[data-theme="mine"] {
  --color-bg-primary: #1a1a2e;
  --color-bg-secondary: #16213e;
  --color-text-primary: #eaeaea;
  --color-text-secondary: #a0a0b0;
  --color-accent: #4fc3f7;
  --color-accent-hover: #29b6f6;
  --color-border: #2a2a4a;
}
```

> 可覆盖的完整变量清单见主仓库 `packages/design-tokens/tokens.css`。只能用 `html[data-theme="你的id"]` 选择器，不能写全局 `body {}` 等会污染其他主题的规则。

### 打包（Windows PowerShell）

GeWu 提供了 `pack.ps1` 模板（见主仓库 `packages/sample-theme-plugin/pack.ps1`），自动生成 ZIP、SHA256 与 `update.json`：

```powershell
.\pack.ps1 -Version 0.1.0 `
  -DownloadUrl "https://github.com/your-name/plugin-theme-mine/releases/latest/download/gewu-plugin.zip"
```

然后把 `dist/gewu-plugin.zip` 和 `dist/update.json` 上传到 GitHub Release。

---

## 关键硬约束（违反会导致插件无法加载）

1. **`id` 必须以 `plugin-` 开头**，只能用小写字母、数字、连字符（`plugin-my-tool` ✓，`MyTool` ✗，`my_tool` ✗）
2. **JS 插件的 `index.js` 必须是 ESM 格式**，通过 `export default` 导出 `PluginManifest`
3. **`react`、`react-dom`、`react/jsx-runtime`、`plugin-protocol`、`kmgr-api`、`workspace` 必须 external**，不能打进产物
4. **`manifest.json` 的 `id` 与源码 `PluginManifest.id` 必须一致**
5. **`themes[].stylesheet` 只能是相对路径**，不能含 `..`、绝对路径、盘符（防目录穿越）
6. **订阅公共事件（`file:open`、`file:select`、`folder:selected` 等）时必须用 `createMultiInstanceFilter` 过滤**，否则多实例下所有实例会同时响应：

```tsx
import { createMultiInstanceFilter } from "plugin-protocol"

const shouldHandle = createMultiInstanceFilter(containerId)
on("file:open", (payload) => {
  if (!shouldHandle(payload)) return
  // 处理事件
})
```

---

## 常见能力速查

### 读取/写入插件自身数据（无需 kmgr 权限）

`pluginData` 是 `PluginContext` 的字段，直接从组件 props 解构（已绑定当前插件 ID，无需传 pluginId）：

```tsx
function MyTool({ pluginData }: PluginContext) {
  const [cfg, setCfg] = useState<{ theme?: string } | null>(null)
  useEffect(() => {
    pluginData?.read("config").then(setCfg)
  }, [pluginData])
  const save = async () => {
    await pluginData?.write("config", { theme: "dark" })
  }
}
```

### 访问知识库（需 `capabilities: ["kmgr:read", "kmgr:write"]`）

```tsx
function MyTool({ kmgr }: PluginContext) {
  if (!kmgr) return <div>仅在桌面端可用</div>
  // kmgr 的具体方法见 kmgr-api 包
}
```

### 向命令面板注册命令

`PluginManifest` 没有独立的 `commands` 字段；带 `label`、`icon`、`category` 的 `shortcuts` 会同时出现在命令面板中（快捷键为可选展示）：

```tsx
const manifest: PluginManifest = {
  // ...
  shortcuts: [
    {
      id: "my-tool:do-something",
      keys: "Ctrl+Shift+D",
      label: "我的工具：做点什么",
      icon: "🛠️",
      category: "我的工具",
      handler: () => console.log("执行"),
    },
  ],
}
```

更多 API 见 [api-reference.md](./api-reference.md)。

---

## 排错清单

| 现象 | 可能原因 | 解决 |
|------|----------|------|
| 插件加载失败，控制台报 "Invalid manifest" | `id` 不符合规则 / `emits`/`handles` 非数组 | 检查 `id` 格式，确保 `emits`/`handles` 是数组（即使为空） |
| 组件渲染但 hooks 失效 | React 被打进了 `index.js` | 确认 `external` 包含 `react`、`react-dom`、`react/jsx-runtime` |
| 安装后插件不出现 | `manifest.json` 的 `id` 与源码不一致 | 对齐两处 `id` |
| 事件触发了但所有容器都响应 | 没用 `createMultiInstanceFilter` | 按上方硬约束 6 加过滤 |
| 主题切换没反应 | CSS 选择器写错 / 变量名拼错 | 检查 `html[data-theme="id"]` 与 `tokens.css` 变量名 |
