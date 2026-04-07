# WireGuard Rules Generator

这个仓库用来维护按用户分开的 WireGuard 分流规则，并自动生成以下平台可引用的规则文件：

- Clash / Mihomo
- sing-box
- Surge
- Shadowrocket

## 目录结构

```text
profiles/<name>/rules.yaml   # 手工维护的源规则
scripts/build-rules.mjs      # 构建脚本
dist/<name>/...              # 自动生成产物
```

## 源规则格式

每个用户一个 `rules.yaml`：

```yaml
name: me
description: my wireguard split rules
domains:
  - nas.960298.xyz
  - router.960298.xyz
cidrs:
  - 192.168.1.0/24
  - 192.168.3.0/24
```

说明：

- `domains` 使用精确域名匹配
- `cidrs` 支持 IPv4/IPv6 CIDR
- 所有规则都统一表示“走 `wg`”

## 本地使用

```bash
npm test
npm run build
```

PowerShell 如果拦截 `npm.ps1`，请使用：

```powershell
npm.cmd test
npm.cmd run build
```

## 生成产物

执行构建后会在 `dist/<name>/` 下生成：

- `clash.yaml`
- `sing-box.source.json`
- `surge.list`
- `shadowrocket.list`

GitHub Actions 额外会把 `sing-box.source.json` 编译成最终可用的 `sing-box.srs`。

## GitHub Raw 引用

产物提交到仓库后，可以通过 Raw URL 直接引用，例如：

- `https://raw.githubusercontent.com/<owner>/<repo>/<branch>/dist/me/clash.yaml`
- `https://raw.githubusercontent.com/<owner>/<repo>/<branch>/dist/me/sing-box.srs`
- `https://raw.githubusercontent.com/<owner>/<repo>/<branch>/dist/me/surge.list`
- `https://raw.githubusercontent.com/<owner>/<repo>/<branch>/dist/me/shadowrocket.list`

## 自动化

`.github/workflows/build.yml` 会在 push 和手动触发时：

1. 安装 Node.js
2. 安装 sing-box
3. 生成最新产物
4. 将 `sing-box.source.json` 编译成 `sing-box.srs`
5. 删除中间 source 文件并将 `dist/` 的变更提交回当前分支
