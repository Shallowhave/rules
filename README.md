# Rules Generator

这个仓库用于按用户维护 WireGuard 分流规则，并通过 GitHub Actions 自动生成多客户端可引用的规则文件。

## 目录结构

```text
profiles/<name>/rules.yaml   # 手工维护的源规则
scripts/build-rules.mjs      # 构建脚本
dist/<name>/...              # GitHub Actions 自动生成的远程产物
```

## 源规则格式

每个用户一个 `rules.yaml`：

```yaml
name: me
description: my wireguard split rules
domains:
  - nas.example.com
  - router.example.com
cidrs:
  - 192.168.1.0/24
  - 192.168.3.0/24
```

如果没有域名规则，可以写成：

```yaml
domains:
```

如果没有网段规则，可以写成：

```yaml
cidrs:
```

## 生成产物

GitHub Actions 会在 `dist/<name>/` 下生成：

- `clash.yaml`: Clash/Mihomo classical 混合规则文件
- `mihomo-domain.yaml`: Mihomo `behavior: domain` 专用文件，仅在存在域名规则时生成
- `mihomo-ipcidr.yaml`: Mihomo `behavior: ipcidr` 专用文件，仅在存在 CIDR 规则时生成
- `sing-box.srs`: sing-box 二进制规则集
- `surge.list`: Surge 规则文件
- `shadowrocket.list`: Shadowrocket 规则文件

## Mihomo 引用示例

如果你使用混合规则文件：

```yaml
rule-providers:
  wg-classical:
    type: http
    behavior: classical
    format: yaml
    path: ./rules/wg-classical.yaml
    url: https://raw.githubusercontent.com/<owner>/<repo>/<branch>/dist/me/clash.yaml
    interval: 86400
```

如果某个用户没有域名，只有 IP/CIDR，建议使用 `ipcidr` 专用文件：

```yaml
rule-providers:
  wg-ipcidr:
    type: http
    behavior: ipcidr
    format: yaml
    path: ./rules/wg-ipcidr.yaml
    url: https://raw.githubusercontent.com/<owner>/<repo>/<branch>/dist/me/mihomo-ipcidr.yaml
    interval: 86400
```

然后在规则里引用：

```yaml
rules:
  - RULE-SET,wg-ipcidr,wg
```

## 自动化

`.github/workflows/build.yml` 会在以下场景运行：

- 源文件 push 后自动运行
- 每天北京时间 00:00 定时运行
- 手动 `workflow_dispatch` 运行

工作流会安装 Node.js 和 sing-box，生成规则文件，编译 `sing-box.srs`，并把 `dist/` 回推到远端仓库。
