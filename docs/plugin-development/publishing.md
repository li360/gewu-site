# 插件发布与社区注册表

> 面向外部插件仓库：构建 ZIP、生成 `update.json`、发 GitHub Release、更新社区注册表。

## 1. 先分清两类插件

| 类型 | 分发方式 | 是否进社区 |
|------|----------|------------|
| **内置插件**（`packages/plugin-*`） | 随 GeWu 安装包发布 | ❌ 不进社区；只能随主程序升级 |
| **外部插件**（独立仓库） | 插件管理 URL/ZIP 安装 | ✅ 需要 Release + 注册表 |

“当前许多插件没注册到社区”通常指内置插件——它们本来就不该出现在社区列表里。

## 2. 外部插件发布产物

每个版本必须提供三个东西：

```text
gewu-plugin.zip      # 根目录含 index.js + manifest.json
update.json          # 版本、下载地址、checksum
GitHub Release       # 资产上传
```

`update.json`：

```json
{
  "version": "0.2.0",
  "id": "plugin-my-tool",
  "name": "我的工具",
  "downloadUrl": "https://github.com/user/plugin-my-tool/releases/latest/download/gewu-plugin.zip",
  "checksum": "sha256:...",
  "minAppVersion": "0.36.1",
  "notes": "修复..."
}
```

社区注册表 `registry.json` 条目：

```json
{
  "id": "plugin-my-tool",
  "name": "我的工具",
  "version": "0.2.0",
  "description": "...",
  "author": "...",
  "icon": "🛠️",
  "homepage": "https://github.com/user/plugin-my-tool",
  "repository": "https://github.com/user/plugin-my-tool",
  "downloadUrl": "https://github.com/user/plugin-my-tool/releases/latest/download/gewu-plugin.zip",
  "checksum": "sha256:..."
}
```

## 3. 自动发布脚本

主仓库提供：

```powershell
pwsh E:\GeWu\MyProj\scripts\publish-plugin.ps1 `
  -PluginPath E:\GeWu\plugin-srt-viewer `
  -GitHubRepo li360/plugin-srt-viewer `
  -PushRegistry
```

流程：

1. 校验 `manifest.json` 的 `id` / `version`
2. `npm run build`
3. 打包 `dist/index.js` + `dist/manifest.json` → `dist/gewu-plugin.zip`
4. 计算 SHA256
5. 生成 `dist/update.json`
6. `gh release create/upload`（已存在则 `--clobber`）
7. 更新 `gewu-plugins-registry/registry.json`（`-PushRegistry` 时先 `pull --ff-only`，再提交并推送；push 被拒会 rebase 重试一次）

> 如果注册表在发布期间被另一个插件更新，脚本会先同步再改；rebase 仍冲突时会中止并提示手动处理，避免强推覆盖别人的条目。

常用参数：

| 参数 | 说明 |
|------|------|
| `-SkipBuild` | 已有 `dist` 时跳过构建 |
| `-SkipUpload` | 只本地打包/生成 update.json |
| `-SkipRegistry` | 不改注册表 |
| `-PushRegistry` | 更新后提交并 push 注册表仓库 |
| `-Notes` | Release 说明 |

> **必须使用 PowerShell 7（`pwsh`）**。Windows PowerShell 5.1 会把 UTF-8 中文 manifest 读成乱码，脚本顶部已加 `#requires -Version 7.0` 直接拦截。
>
> 发布前 `$GitHubRepo` 必须已存在且当前 `gh` 账号有权限；脚本会先 `gh repo view` 校验，避免 Release 404。

首次发布前，插件仓库需要：

- `manifest.json` 声明 `repository` / `updateUrl`（更新检查用）
- GitHub 仓库已有 remote，`gh auth status` 已登录
- 版本号已递增（`manifest.version`）

## 4. 为什么“刷新注册表/检查更新”发现不了新版本

- **刷新注册表**只刷新社区列表（`registry.json`），不会检查已安装插件的版本。
- **检查更新**只对有 `updateUrl` 或 `repository` 的插件生效；它读 GitHub Release 的 `update.json` 或 `latest/download`。
- 如果插件没有新 Release，或注册表版本落后于 Release，就不会有更新提示。
- 典型例子：图库插件本地 `manifest.version` 0.6.0，但 GitHub 最新 Release 仍是 v0.4.0，注册表也是 0.4.0 —— 因此“检查更新”没有新版本是正确行为，不是 Bug。

发布顺序必须是：

```text
递增 manifest.version
→ 构建/打包
→ GitHub Release 上传
→ 更新 registry.json
→ 用户刷新注册表 / 检查更新
```

先更新注册表再发 Release 会导致下载 404；只发 Release 不更新注册表，社区列表仍显示旧版本（但已安装插件检查更新可以读到新 Release）。

## 5. 验收

- `gewu-plugin.zip` 根目录只有 `index.js` / `manifest.json`
- `update.json` 的 `checksum` 与 ZIP 实际 SHA256 一致
- Release 的 `latest` 指向新版本
- `registry.json` 的 `version` / `checksum` / `downloadUrl` 与 Release 一致
- 旧版本安装后能通过“检查更新”升级
- 卸载/禁用不残留
