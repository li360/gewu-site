# 主题插件开发指南（纯 CSS）

GeWu 支持一种**不执行任何 JavaScript** 的插件形态：纯 CSS 主题插件。它只通过覆盖设计令牌（Design Tokens，即一组 CSS 自定义属性）改变应用外观，因此：

- 无需打包工具，`manifest.json` + `*.css` 两个文件即可
- 不申请任何 capability，不能访问事件总线、Tauri IPC、知识库 API
- 可与 JS 功能插件共存：一个普通 JS 插件也可以同时声明 `themes`（混合形态）

完整示例见 [`packages/sample-theme-plugin/`](../../packages/sample-theme-plugin/)。

## 1. 目录结构

```
plugin-theme-midnight/
├── manifest.json     ← 插件清单（声明 themes 贡献点）
└── theme.css         ← 主题样式表（仅覆盖 CSS 变量）
```

打包发布时压缩为 `gewu-plugin.zip`，两个文件位于 ZIP 根目录（见第 5 节）。

## 2. manifest.json

```json
{
  "id": "plugin-theme-midnight",
  "name": "午夜主题",
  "version": "0.1.0",
  "description": "深邃午夜蓝配色",
  "author": "Your Name",
  "icon": "🌙",
  "repository": "https://github.com/<owner>/<repo>",
  "minAppVersion": "0.29.0",
  "themes": [
    {
      "id": "midnight",
      "name": "午夜",
      "icon": "🌃",
      "stylesheet": "theme.css"
    }
  ]
}
```

### 与普通插件的差异

| 规则 | 说明 |
|------|------|
| 没有 `index.js` | 纯 CSS 插件不提供 JS 入口；此时 `themes` 必须为非空数组，否则扫描器报错 |
| `emits` / `handles` 可省略 | 纯 CSS 插件不参与事件系统，默认按空数组处理 |
| `themes[].stylesheet` | 必须是插件目录内的相对路径，以 `.css` 结尾；禁止 `..`、绝对路径、盘符及 `<>\|` 字符 |
| `themes[].id` | 仅允许 `A-Za-z0-9_-`；将作为 `data-theme` 属性值 |
| 主题 ID 保留 | 不能使用内置主题 ID：`light`、`dark`、`colorful`、`ocean`、`aurora`（冲突时外部主题会被跳过并在控制台告警） |

### `themes` 字段说明

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `id` | string | 是 | 主题唯一标识，作为 `html[data-theme="..."]` 的属性值 |
| `name` | string | 是 | 显示名称（顶栏主题菜单、设置外观页） |
| `stylesheet` | string | 是 | CSS 文件相对路径，如 `"theme.css"` 或 `"themes/night.css"` |
| `icon` | string | 否 | emoji 图标，显示在设置卡片上；缺省使用 🎨 |

> 一个插件可声明多个主题（`themes` 数组多项），共用同一个插件包安装与启停。

## 3. 编写 theme.css

### 基本规则

1. 选择器固定为 `html[data-theme="你的主题id"]`
2. **只允许覆盖设计令牌变量**，即重新声明 `--color-*` 等自定义属性
3. 未覆盖的变量自动继承 `:root` 默认值，因此只需写你想改动的变量
4. 不应包含元素选择器、`!important` 覆盖、外部字体 `@import`、`url(...)` 远程资源等——样式表会被原样注入主文档，请勿依赖任何相对路径资源

### 可覆盖的变量

完整变量清单见 [`packages/design-tokens/tokens.css`](../../packages/design-tokens/tokens.css)。一套主题通常应覆盖全部**颜色语义变量**，其他类别（间距 `--space-*`、字号 `--font-size-*`、圆角、阴影等）保持继承即可。

颜色变量分组（以内置 dark 主题为例）：

| 分组 | 变量示例 |
|------|----------|
| 背景层级 | `--color-bg-page` `--color-bg-panel` `--color-bg-card` `--color-bg-elevated` `--color-bg-input` `--color-bg-hover` `--color-bg-active` `--color-bg-selected` `--color-bg-disabled` |
| 文字 | `--color-text-primary` `--color-text-secondary` `--color-text-disabled` `--color-text-inverse` |
| 边框 / 焦点 | `--color-border` `--color-border-hover` `--color-border-focus` |
| 主色 | `--color-primary` `--color-primary-hover` `--color-primary-active` `--color-primary-bg` |
| 语义色 | `--color-success` `--color-success-bg` `--color-warning` `--color-warning-bg` `--color-error` `--color-error-bg` |
| 强调色 | `--color-accent` `--color-accent-bg` |
| 其他 | `--color-overlay-backdrop` `--color-scrollbar-thumb` `--color-scrollbar-track` `--color-resizer` `--color-resizer-hover` `--color-topbar-bg` `--color-topbar-border` `--color-bottombar-bg` `--color-bottombar-text` `--color-bg-tooltip` `--color-text-tooltip` |

### 示例

```css
html[data-theme="midnight"] {
  --color-bg-page: #0b1020;
  --color-bg-panel: #10172a;
  --color-text-primary: #dbe6ff;
  --color-primary: #3b82f6;
  /* …其余变量按需覆盖 */
}
```

### 高级：渐变/发光（可选）

`tokens.css` 预留了三个可覆盖的特殊变量，普通主题保持继承即可：

| 变量 | 作用 |
|------|------|
| `--gradient-primary` | 主色渐变（如 aurora 主题的三色渐变） |
| `--color-active-header-bg` | 激活态标题栏背景 |
| `--color-secondary` / `--shadow-glow` | 次主色与发光阴影 |

## 4. 安装、启停与卸载行为

- **安装**：用户通过插件管理的「URL 安装」「手动安装 ZIP」安装；安装后在「顶栏 → 查看 → 主题」或「设置 → 外观」中即可看到新主题
- **启用/禁用**：启用时样式表以 `<style data-gewu-theme="id">` 注入主文档；禁用或卸载时自动移除
- **失效回退**：如果当前选中的主题随插件被禁用/卸载而消失，应用自动回退到 `light`
- **主题选择持久化**：用户选择的主题 ID 记录在本地；外部主题尚未注册完成前不影响应用启动

## 5. 打包与发布（URL 安装 / 自更新）

### 5.1 分发包约定

| 产物 | 文件名 | 说明 |
|--------|----------|------|
| 插件包 | `gewu-plugin.zip` | 内含 `manifest.json` 与 CSS 文件（扁平结构或单一根目录均可） |
| 更新清单 | `update.json` | 描述最新版本号、下载地址、校验和 |

Windows 下可直接使用示例插件的 `pack.ps1`（PowerShell 5.1+）：

```powershell
.\pack.ps1 `
  -Version 0.2.0 `
  -DownloadUrl "https://github.com/<owner>/<repo>/releases/latest/download/gewu-plugin.zip" `
  -Notes "调整蓝色主色"
```

脚本会生成 `dist/gewu-plugin.zip`、计算 SHA256 并写出 `dist/update.json`。

### 5.2 GitHub Release 发布（推荐，零配置）

1. 建一个公开仓库（地址即用户安装时粘贴的 URL）
2. 发布 Release，并保证最新 Release 带 `latest` 标记
3. 向 Release 上传两个附件：`gewu-plugin.zip`、`update.json`
4. 用户在「URL 安装」粘贴仓库地址即可安装；之后在「已安装 → 检查更新」一键升级

客户端按以下顺序自动探测，任一成功即可（直连失败会自动尝试镜像）：

```
https://github.com/<owner>/<repo>/releases/latest/download/update.json
https://gh-proxy.com/<上述地址>
https://gh.llkk.cc/<上述地址>
https://kkgithub.com/<owner>/<repo>/releases/latest/download/update.json
```

### 5.3 自定义更新地址

在 `manifest.json` 中声明 `updateUrl`（指向你自己的 `update.json`），即可不依赖 GitHub Release：

```json
"updateUrl": "https://example.com/gewu/my-theme/update.json"
```

用户也可以直接粘贴 `update.json` 的完整 URL 或 `gewu-plugin.zip` 的直链进行安装。

### 5.4 update.json 字段

```json
{
  "version": "0.2.0",
  "downloadUrl": "https://github.com/<owner>/<repo>/releases/latest/download/gewu-plugin.zip",
  "checksum": "sha256:ab12…",
  "minAppVersion": "0.29.0",
  "id": "plugin-theme-midnight",
  "name": "午夜主题",
  "description": "深邃午夜蓝配色",
  "author": "Your Name",
  "notes": "本次更新内容"
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `version` | string | 是 | 新版本语义化版本号，高于本地版本才提示更新 |
| `downloadUrl` | string | 是 | `gewu-plugin.zip` 下载地址 |
| `checksum` | string | 否 | `sha256:` 前缀 + 十六进制摘要，安装前校验 |
| `minAppVersion` | string | 否 | 最低主程序版本，不满足时禁止安装并在确认窗提示 |
| `id` `name` `description` `author` | string | 否 | 元数据，用于 ZIP 直链安装时补全确认窗信息 |
| `notes` | string | 否 | 更新说明，展示在更新确认窗 |
| `capabilities` | string[] | 否 | 权限声明（纯 CSS 插件无需提供） |

## 6. 混合形态：JS 插件同时贡献主题

普通 JS 插件在 `manifest.json` 中追加 `themes` 数组即可同时提供主题：

```json
{
  "id": "plugin-my-tool",
  "themes": [{ "id": "my-tool-dark", "name": "工具暗色", "stylesheet": "theme.css" }]
}
```

运行时主应用会先加载 JS 再读取并注入 CSS，两者互不影响；禁用/卸载插件时主题一并移除。
