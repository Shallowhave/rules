# WireGuard Rules Generator Design

**目标**

建立一个以 GitHub 仓库为中心的规则生成项目，使用每个用户独立的 `rules.yaml` 作为唯一事实来源，自动生成 Clash、sing-box、Surge、Shadowrocket 可直接引用的规则文件。

**范围**

- 仅生成规则文件，不生成完整客户端配置
- 首版只支持一个动作语义：`wg`
- 每个用户独立维护自己的规则，不共享公共基线
- 源数据仅支持两类匹配对象：精确域名与 IP/CIDR

**仓库结构**

```text
profiles/<name>/rules.yaml   # 唯一事实来源
scripts/build-rules.mjs      # 读取源数据并生成产物
dist/<name>/...              # 自动生成产物
.github/workflows/build.yml  # GitHub Actions 自动构建
```

**源数据格式**

每个用户一个 `rules.yaml`，支持以下字段：

- `name`: 用户标识
- `description`: 可选说明
- `domains`: 精确域名数组
- `cidrs`: IP/CIDR 数组，允许 IPv4/IPv6

构建时执行以下归一化：

- 域名转小写
- 删除空项
- 自动去重
- 产物稳定排序
- 校验 CIDR 格式

**输出格式**

- `dist/<name>/clash.yaml`: Clash/Mihomo 规则提供者格式，`payload` 中写入 `DOMAIN,...` 与 `IP-CIDR,...,no-resolve`
- `dist/<name>/sing-box.srs`: GitHub Actions 使用 sing-box 官方编译命令生成的二进制规则集
- `dist/<name>/surge.list`: 纯规则行，策略名固定为 `wg`
- `dist/<name>/shadowrocket.list`: 与 Surge 相同的纯规则行，策略名固定为 `wg`

**数据流**

1. 维护者编辑 `profiles/<name>/rules.yaml`
2. 本地或 GitHub Actions 执行构建脚本
3. 脚本校验、归一化并写入 `dist/<name>/clash.yaml`、`sing-box.source.json`、`surge.list`、`shadowrocket.list`
4. GitHub Actions 调用 `sing-box rule-set compile` 将 source JSON 编译为 `sing-box.srs`
5. GitHub Actions 清理中间 source 文件并将最新产物提交回仓库，供 Raw URL 引用

**错误处理**

- YAML 结构错误时构建失败
- 缺失 `name`、`domains`、`cidrs` 以外的非法结构时构建失败
- CIDR 非法时构建失败并指明值

**测试**

- 对示例用户 `me` 写构建回归测试
- 覆盖域名展开、CIDR 输出、各平台文件内容与关键格式
- 增加非法 CIDR 的失败用例
