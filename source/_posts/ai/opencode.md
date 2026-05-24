---
title: OpenCode 使用指南
date: 2026-05-24 00:00:00
categories: AI
tags:
  - tools
  - AI
sticky: 0
#cover:
comments: true
toc: true
---

OpenCode 是一个开源的 AI 编程代理（AI Coding Agent），拥有超过 160K GitHub Star。支持 75+ 大模型提供商，可在终端、桌面应用和 IDE 中使用。

本文介绍在 Windows 11 环境下安装配置 OpenCode，并接入 DeepSeek V4 Pro 模型。

<!-- more -->

## OpenCode 简介

{% alertpanel info "核心特性" %}

- **LSP 智能集成** — 自动加载语言服务器，让 LLM 理解代码结构
- **多会话并行** — 同一项目可启动多个 Agent 同时工作
- **会话分享** — 一键生成分享链接，便于协作与排查
- **Plan + Build 模式** — 先在 Plan 模式下讨论方案，再切换到 Build 模式执行
- **撤销 / 重做** — `/undo` 和 `/redo` 命令可回退或重做 AI 的修改
- **75+ 模型提供商** — 支持 DeepSeek、OpenAI、Anthropic、本地模型等
- **多终端支持** — 终端 TUI、桌面应用、IDE 插件、Web 界面

{% endalertpanel %}

## Windows 11 安装

### 方法一：WSL（推荐）

官方推荐在 Windows 上使用 WSL 以获得最佳体验。

首先[安装 WSL](https://learn.microsoft.com/zh-cn/windows/wsl/install)：

```powershell
wsl --install
```

然后在 WSL 终端中安装 OpenCode：

```bash
curl -fsSL https://opencode.ai/install | bash
```

项目位于 Windows 磁盘时，通过 `/mnt/` 路径访问：

```bash
cd /mnt/d/github.com/my-project
opencode
```

### 方法二：Chocolatey

```powershell
choco install opencode
```

### 方法三：Scoop

```powershell
scoop install opencode
```

### 方法四：NPM

```powershell
npm install -g opencode-ai
```

{% alertpanel warning "注意" %}

- Windows 本机运行可能存在性能问题，**优先使用 WSL**。
- 需要现代终端模拟器（如 [WezTerm](https://wezterm.org)、[Alacritty](https://alacritty.org)）以获得完整渲染支持。

{% endalertpanel %}

## 接入 DeepSeek V4 Pro

### 获取 API Key

1. 前往 [DeepSeek 开放平台](https://platform.deepseek.com/) 注册并登录
2. 点击左侧菜单 **API keys** -> **创建 API key**
3. 复制生成的 API Key

### 配置模型

在终端启动 OpenCode：

```bash
opencode
```

执行 `/connect` 命令连接 DeepSeek 提供商：

```
/connect
```

在列表中选择 **DeepSeek**，粘贴 API Key：

```
┌ API key
│
└ enter
```

执行 `/models` 命令切换模型：

```
/models
```

选择 `deepseek-v4-pro` 模型。

### 设为默认模型（可选）

在项目根目录创建 `opencode.json` 配置文件：

```json
{
  "$schema": "https://opencode.ai/config.json",
  "model": "deepseek/deepseek-v4-pro"
}
```

{% alertpanel info "配置文件位置" %}

- 项目级：项目根目录 `opencode.json`
- 全局：`~/.config/opencode/opencode.json`（Linux/WSL）或 `%APPDATA%\opencode\opencode.json`（Windows）
- API Key 存储在 `~/.local/share/opencode/auth.json`

{% endalertpanel %}

## 基本使用

### 项目初始化

进入项目目录，启动 OpenCode 后先执行 `/init`，让 OpenCode 分析项目结构并生成 `AGENTS.md`：

```
cd /path/to/project
opencode
```

```
/init
```

`AGENTS.md` 是 OpenCode 理解项目的关键文件，记录架构、命令、规范等信息，**建议提交到 Git**。

### 模式切换

OpenCode 有 **Plan 模式**（计划）和 **Build 模式**（构建）两种工作模式，按 `Tab` 键切换。

| 模式 | 说明 | 右下角指示 |
| --- | --- | --- |
| Build | 默认模式，可直接修改代码 | Build |
| Plan | 禁用写操作，仅讨论方案不执行 | Plan |

推荐工作流：先在 Plan 模式下与 AI 讨论实现方案，确认后再切回 Build 模式执行。

### 常用命令

| 命令 | 功能 |
| --- | --- |
| `/init` | 分析项目并生成 AGENTS.md |
| `/connect` | 连接 / 切换模型提供商 |
| `/models` | 浏览与切换模型 |
| `/undo` | 撤销上一步 AI 所做的修改 |
| `/redo` | 重做被撤销的修改 |
| `/share` | 生成会话分享链接 |
| `/clear` | 清除当前会话上下文 |

### 文件引用

在提示词中输入 `@` 可以模糊搜索并引用项目中的文件：

```
请解释 @packages/utils/auth.ts 中的认证逻辑
```

### 拖拽图片

将截图或设计稿直接拖入终端窗口，OpenCode 会识别图片内容并加入上下文：

```
请参考这张设计稿实现用户设置页面
[拖拽图片到终端]
```

## 提示词技巧

### 让 AI 先出方案再动手

```
我们需要为 /settings 路由添加权限校验。
请先说明你的实现方案，不要直接修改代码。
```

### 提供充足的上下文

```
参考 @src/services/auth.ts 的实现方式，
为 @src/services/payment.ts 添加同样的日志记录逻辑。
```

### 描述越具体越好

像给初级开发者分配任务一样描述需求——说明目标、约束条件、期望的输出格式。

## 进阶配置

### 自定义 AGENTS.md

`AGENTS.md` 是项目级别的说明书，可以包含：

- 项目架构概览
- 常用命令（构建、测试、检查）
- 代码风格与命名规范
- CI/CD 流程说明

```markdown
# AGENTS.md

## Commands
| Command | Does |
|---|---|
| `pnpm run build` | 构建项目 |
| `pnpm run test` | 运行测试 |

## Architecture
- 源码目录 `src/`，按功能模块划分子目录
- 使用 TypeScript 严格模式
```

### 模型参数调优

在 `opencode.json` 中可为特定模型配置推理参数：

```json
{
  "$schema": "https://opencode.ai/config.json",
  "provider": {
    "deepseek": {
      "models": {
        "deepseek-v4-pro": {
          "options": {
            "reasoningEffort": "high"
          }
        }
      }
    }
  }
}
```

## 与其他模型对比

| 特性 | OpenCode | GitHub Copilot | Cursor |
| --- | --- | --- | --- |
| 开源 | 是 | 否 | 否 |
| 模型选择 | 75+ 提供商自由选择 | 仅 Copilot 模型 | 有限选择 |
| 本地模型 | 支持 (Ollama/lmstudio 等) | 不支持 | 不支持 |
| 运行方式 | 终端 / 桌面 / IDE / Web | IDE 插件 | IDE |
| Plan 模式 | 内置 | 无 | 无 |
| 会话分享 | 内置 | 无 | 无 |

## 参考链接

- [OpenCode 官网](https://opencode.ai)
- [OpenCode 文档](https://opencode.ai/docs)
- [GitHub 仓库](https://github.com/anomalyco/opencode)
- [DeepSeek 开放平台](https://platform.deepseek.com/)
- [Windows WSL 配置指南](https://opencode.ai/docs/windows-wsl)
