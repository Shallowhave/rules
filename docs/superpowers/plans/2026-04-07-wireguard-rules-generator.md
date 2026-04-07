# WireGuard Rules Generator Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 构建一个从 `profiles/<name>/rules.yaml` 生成多平台规则文件并可由 GitHub Actions 自动发布的最小可用仓库。

**Architecture:** 使用一个零依赖 Node.js 构建脚本遍历 `profiles` 目录，读取受限 YAML 子集并输出 `dist`。测试使用 Node 内置测试运行器，先验证失败，再实现最小功能通过测试，最后接入 GitHub Actions 自动构建与回写产物。

**Tech Stack:** Node.js 20、Node test runner、GitHub Actions

---

### Task 1: 建立失败测试

**Files:**
- Create: `D:/git/rules/tests/build-rules.test.mjs`
- Create: `D:/git/rules/package.json`

- [ ] **Step 1: 写出期望产物测试**
- [ ] **Step 2: 运行测试并确认因缺少构建脚本而失败**
- [ ] **Step 3: 补充最小测试运行配置**
- [ ] **Step 4: 再次运行测试并确认失败原因正确**

### Task 2: 实现规则构建脚本

**Files:**
- Create: `D:/git/rules/scripts/build-rules.mjs`
- Create: `D:/git/rules/profiles/me/rules.yaml`

- [ ] **Step 1: 实现受限 YAML 读取与数据校验**
- [ ] **Step 2: 实现 Clash、sing-box、Surge、Shadowrocket 输出**
- [ ] **Step 3: 运行测试并确认通过**

### Task 3: 补齐仓库说明与自动化

**Files:**
- Create: `D:/git/rules/README.md`
- Create: `D:/git/rules/.github/workflows/build.yml`
- Create: `D:/git/rules/.gitignore`

- [ ] **Step 1: 写 README，说明目录结构与 Raw 引用方式**
- [ ] **Step 2: 写 GitHub Actions 自动构建并提交 `dist`**
- [ ] **Step 3: 运行完整测试与构建命令验证**
