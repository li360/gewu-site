# 第三方插件 SDK

> 目标：外部开发者/外部 AI **不需要 GeWu 主仓库源码**，也能完成插件的类型检查与构建。

## 1. 生成 SDK

在 GeWu 主仓库运行：

```powershell
cd <GeWu 主仓库>
pwsh -NoProfile -File scripts\export-plugin-sdk.ps1 -OutDir <你的插件目录>\plugin-sdk
```

产物：

```text
plugin-sdk/
├── kmgr-api-0.1.0.tgz
├── plugin-protocol-0.1.0.tgz
└── README.md
```

脚本从 `packages/kmgr-api`、`packages/plugin-protocol` 执行 `npm pack`，包含类型与运行时纯函数契约。

## 2. 在插件仓库安装

```json
{
  "dependencies": {
    "kmgr-api": "file:./plugin-sdk/kmgr-api-0.1.0.tgz",
    "plugin-protocol": "file:./plugin-sdk/plugin-protocol-0.1.0.tgz",
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  }
}
```

```powershell
npm install
npm run typecheck
npm run build
```

## 3. 运行时仍由宿主提供

SDK 只用于类型/构建。以下模块必须保持 esbuild `external`：

```js
external: [
  "react",
  "react-dom",
  "react/jsx-runtime",
  "plugin-protocol",
  "kmgr-api",
  "workspace",
]
```

宿主 `plugin-distribution` 会把这些裸模块说明符替换为共享代理；打进插件会导致双 React 实例或加载失败。

## 4. 版本

- SDK 当前对应 GeWu 0.36.0 beta，包版本 `0.1.0`；
- 宿主 API 变更时重新生成 tarball，并在插件 `minAppVersion` 中标注最低宿主版本；
- 外部插件无需、也不应修改 `..\MyProj`。

## 5. 当前限制

- `plugin-protocol` / `kmgr-api` 仍是 `private` 包，未发布 npm registry；tarball 是当前分发方式。
- 未来若发布到 npm，可改为正式版本号依赖；本流程保持兼容。
