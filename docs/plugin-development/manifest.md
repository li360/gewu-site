# manifest 规范

GeWu 插件有两份 manifest：

| 文件 | 作用 | 位置 |
|------|------|------|
| `manifest.json` | 分发元数据（存储格式） | 插件根目录 |
| `PluginManifest` | 运行时类型（TypeScript 接口） | `plugin-protocol` 包 |

两者通过转换函数映射：`manifest.json` → `PluginManifest`（`component` 字段由 JS 包提供，不在 JSON 中）。

## manifest.json 字段

```json
{
  "id": "plugin-my-tool",
  "name": "我的工具",
  "version": "0.1.0",
  "description": "一个示例插件",
  "author": "作者名",
  "icon": "🛠️",
  "repository": "https://github.com/user/plugin-my-tool",
  "updateUrl": "https://example.com/gewu/my-tool/update.json",
  "minAppVersion": "0.29.0",
  "capabilities": ["kmgr:read"],
  "emits": ["custom:event"],
  "handles": ["file:open"],
  "preferredExtensions": [".txt"],
  "isEditor": false,
  "layoutHints": { "preferredWeight": 0.5 },
  "statusBarItems": [
    { "id": "my-tool:status", "label": "状态", "value": "-", "priority": 10 }
  ],
  "themes": [
    { "id": "my-dark", "name": "我的暗色", "icon": "🌙", "stylesheet": "theme.css" }
  ]
}
```

## 字段说明

### 必填字段

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | string | 插件唯一标识，规则：`plugin-` 前缀 + 小写字母/数字/连字符，如 `"plugin-my-tool"` |
| `name` | string | 显示名称 |
| 内容字段 | — | 以下二者至少满足其一：① 提供 `index.js`（JS 插件，`emits`/`handles` 按实际填写）；② 声明非空 `themes`（纯 CSS 主题插件，可无 `emits`/`handles`，详见 [主题插件开发指南](./themes.md)） |

### 可选字段 — 分发与更新

| 字段 | 类型 | 说明 |
|------|------|------|
| `version` | string | 语义化版本号，如 `"0.1.0"`。用于更新检测 |
| `description` | string | 插件描述，显示在插件管理面板 |
| `author` | string | 作者信息 |
| `repository` | string | 源码仓库地址；GitHub 仓库地址同时作为更新探测地址（Release 约定，见 [打包规范](./packaging.md#发布与-url-安装)） |
| `updateUrl` | string | 自定义更新清单地址（指向 `update.json`）；存在时优先于 `repository` 的 Release 约定 |
| `minAppVersion` | string | 最低主程序版本（语义化版本），不满足时跳过加载/禁止安装，并在安装确认窗提示 |
| `icon` | string | emoji 图标，如 `"🛠️"` |

### 可选字段 — 运行时行为

| 字段 | 类型 | 说明 |
|------|------|------|
| `capabilities` | string[] | 声明所需权限，如 `["kmgr:read", "kmgr:write"]`。workspace 据此决定是否注入 kmgr 等 API |
| `isEditor` | boolean | 是否为编辑器插件。编辑器插件会收到 `editor` 上下文（文件内容、保存函数等） |
| `preferredExtensions` | string[] | 编辑器插件声明的首选文件扩展名，如 `[".md", ".markdown"]` |
| `layoutHints` | object | 布局偏好，见下方详细说明 |
| `statusBarItems` | array | 状态栏项，见下方详细说明 |

### layoutHints

```json
"layoutHints": {
  "preferredWeight": 0.5,
  "minWidth": 180,
  "maxWidth": 600
}
```

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `preferredWidth` | number | 1.0 | 建议宽度权重（相对于其它容器，如 0.3 = 占 30%） |
| `minWidth` | number | 180 | 最小宽度（px） |
| `maxWidth` | number | 无限制 | 最大宽度（px） |

### statusBarItems

```json
"statusBarItems": [
  {
    "id": "my-tool:status",
    "label": "状态",
    "value": "-",
    "align": "left",
    "priority": 10
  }
]
```

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `id` | string | — | 唯一标识，如 `"editor:cursor"` |
| `label` | string | — | 标签文本，如 `"行"` |
| `value` | string | — | 值文本，如 `"42"` |
| `align` | `"left"` \| `"right"` | `"left"` | 对齐方向 |
| `priority` | number | 100 | 排序优先级（数字越小越靠前） |

插件可通过 `emit("statusbar:update", { id, value })` 动态更新状态栏项的值。

### themes — 主题贡献点

声明插件提供的一个或多个 CSS 主题。纯 CSS 主题插件（无 `index.js`）**必须**声明非空 `themes`；JS 插件也可声明（混合形态）。完整开发指南见 [themes.md](./themes.md)。

```json
"themes": [
  { "id": "my-dark", "name": "我的暗色", "icon": "🌙", "stylesheet": "theme.css" }
]
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `id` | string | 是 | 主题 ID，仅允许 `A-Za-z0-9_-`；不得占用内置 ID（`light`/`dark`/`colorful`/`ocean`/`aurora`） |
| `name` | string | 是 | 主题显示名 |
| `stylesheet` | string | 是 | 插件目录内的相对 `.css` 路径，禁止 `..`、绝对路径、盘符 |
| `icon` | string | 否 | emoji 图标 |

## capabilities 权限声明

当前支持的 capability：

| Capability | 含义 |
|------------|------|
| `kmgr:read` | 允许通过 `ctx.kmgr` 读取知识库 |
| `kmgr:write` | 允许通过 `ctx.kmgr` 写入知识库 |

> **注意**：当前阶段 workspace 通过 `setKmgrApi()` 全局注入 API，`ctx.kmgr` 对所有插件可见。capabilities 声明机制将在后续版本强制执行。

## 与 PluginManifest 的映射关系

| manifest.json | PluginManifest | 说明 |
|---|---|---|
| `id` | `id` | 插件唯一 ID |
| `name` | `name` | 显示名称 |
| `version` | `version` | 版本号（可选） |
| `description` | `description` | 描述（可选） |
| `author` | `author` | 作者（可选） |
| `repository` | `repository` | 仓库地址（可选） |
| `updateUrl` | `updateUrl` | 自定义更新清单地址（可选） |
| `minAppVersion` | `minAppVersion` | 最低主程序版本（可选） |
| `capabilities` | `capabilities` | 权限声明（可选） |
| `icon` | `icon` | emoji 图标 |
| `emits` | `emits` | 发射的事件 |
| `handles` | `handles` | 处理的事件 |
| `preferredExtensions` | `preferredExtensions` | 文件扩展名关联 |
| `isEditor` | `isEditor` | 是否为编辑器 |
| `layoutHints` | `layoutHints` | 布局偏好 |
| `statusBarItems` | `statusBarItems` | 状态栏项 |
| `themes` | `themes` | 主题贡献点；运行时每项额外携带读取到的 `cssText`（见 [themes.md](./themes.md)） |
| — | `component` | **不在 JSON 中**，由 JS 包的 `export default` 提供 |
| — | `shortcuts` | 快捷键（仅运行时声明，不在 JSON 中） |
| — | `menuItems` | 菜单栏（仅运行时声明，不在 JSON 中） |
| — | `templates` | 文件模板（仅运行时声明，不在 JSON 中） |
