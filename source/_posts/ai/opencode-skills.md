---
title: OpenCode Skills 详解
date: 2026-05-24 01:00:00
categories: AI
tags:
  - tools
  - AI
  - skills
sticky: 0
#cover:
comments: true
toc: true
---

Skills（技能）是 AI 编程代理的"专业知识包"——将特定领域的指令、脚本和资源封装为可复用的模块，让 Agent 在需要时动态加载。本文介绍 OpenCode 中 Skills 的使用方法，以及三套值得关注的开源 Skills 集合。

<!-- more -->

## Skills 是什么

Skills 本质上是一个包含 `SKILL.md` 文件的文件夹，其中包含 YAML 前置元数据和 Markdown 指令。Agent 不会一次性加载所有 Skills，而是根据当前任务按需调用——既节省上下文，又保证专业性。

```
skills/
├── frontend-design/
│   └── SKILL.md          # 指令 + 元数据
├── webapp-testing/
│   ├── SKILL.md
│   └── scripts/          # 可选的辅助脚本
│       └── with_server.py
└── pdf/
    ├── SKILL.md
    └── scripts/
```

## Skills 基本使用方法

### 目录结构与存放位置

OpenCode 会从以下路径自动发现 Skills（按优先级）：

| 路径 | 作用域 |
| --- | --- |
| `.opencode/skills/<name>/SKILL.md` | 项目级（推荐） |
| `~/.config/opencode/skills/<name>/SKILL.md` | 全局 |
| `.claude/skills/<name>/SKILL.md` | 项目级（Claude 兼容） |
| `~/.claude/skills/<name>/SKILL.md` | 全局（Claude 兼容） |
| `.agents/skills/<name>/SKILL.md` | 项目级（通用兼容） |

> OpenCode 会从当前工作目录向上遍历到 Git 仓库根目录，沿路加载所有匹配的 Skills。

### SKILL.md 文件结构

每个 `SKILL.md` 文件以 YAML frontmatter 开头：

```markdown
---
name: git-release
description: 创建规范的发布版本与 changelog
license: MIT
metadata:
  audience: maintainers
---

## 功能
- 从已合并的 PR 草拟发布说明
- 建议版本号升级
- 生成可直接使用的 `gh release create` 命令

## 使用时机
当你准备创建带标签的发布版本时使用此技能。
```

{% alertpanel info "命名规则" %}

- `name` 必须为 1-64 字符，小写字母 + 数字 + 单连字符
- 不能以 `-` 开头或结尾，不允许连续 `--`
- `name` 必须与目录名一致

{% endalertpanel %}

### 工作原理

1. Agent 启动时扫描所有 Skills 目录
2. 将 `name` 和 `description` 注入 `skill` 工具的描述中
3. 当对话上下文匹配某个 Skill 的 `description`，Agent 调用 `skill({ name: "..." })` 加载完整内容
4. Skill 内容注入当前对话，Agent 按指令执行

### 权限控制

通过 `opencode.json` 控制 Skills 的访问权限：

```json
{
  "permission": {
    "skill": {
      "*": "allow",
      "internal-*": "deny",
      "experimental-*": "ask"
    }
  }
}
```

| 权限 | 行为 |
| --- | --- |
| `allow` | 自动加载 |
| `deny` | 对 Agent 完全隐藏 |
| `ask` | 使用前弹出确认提示 |

支持通配符匹配：如 `internal-*` 匹配 `internal-docs`、`internal-tools` 等。

### 按 Agent 覆盖权限

```json
{
  "agent": {
    "plan": {
      "permission": {
        "skill": {
          "internal-*": "allow"
        }
      }
    }
  }
}
```

## anthropics/skills 常用 Skills 介绍

[anthropics/skills](https://github.com/anthropics/skills) 是 Anthropic 官方维护的 Skills 集合（140K+ Star），既是 Skills 规范的参考实现，也是生产级 Skills 的示范。以下介绍其中的核心 Skills：

### 创意与设计类

| Skill | 功能 |
| --- | --- |
| **frontend-design** | 创建独特的、产品级前端界面，注重排版、配色、动效与空间构图，刻意避免千篇一律的"AI 风格" |
| **canvas-design** | 在 HTML Canvas 上创建视觉设计（海报、艺术作品等），输出为 PNG/SVG |
| **algorithmic-art** | 使用 p5.js 创建算法生成艺术（流场、粒子系统等） |
| **theme-factory** | 为幻灯片、文档、网页等生成主题配色与字体搭配 |

### 开发与技术类

| Skill | 功能 |
| --- | --- |
| **webapp-testing** | 使用 Playwright 对 Web 应用进行自动化测试，支持截图、DOM 检查、浏览器日志捕获 |
| **mcp-builder** | 指导创建高质量的 MCP Server，用于集成外部工具与 API |
| **web-artifacts-builder** | 构建复杂的多组件 HTML Artifacts，支持 React、Tailwind CSS、shadcn/ui |
| **claude-api** | 指导使用 Claude API 的最佳实践 |

### 企业与沟通类

| Skill | 功能 |
| --- | --- |
| **brand-guidelines** | 应用公司品牌色彩、字体、Logo 规范 |
| **internal-comms** | 编写内部沟通文档（状态报告、公告、FAQ 等） |
| **doc-coauthoring** | 协作撰写文档（提案、技术规范、决策记录） |

### 文档处理类

| Skill | 功能 |
| --- | --- |
| **docx** | 创建和编辑 Word 文档，支持修订跟踪、评论、格式保留 |
| **pdf** | 提取 PDF 表单字段、填写 PDF、合并拆分等 |
| **pptx** | 创建和编辑 PowerPoint 演示文稿 |
| **xlsx** | 创建和编辑 Excel 电子表格，支持公式和图表 |

### 在 OpenCode 中使用 anthropics/skills

1. 克隆仓库或将其 Skills 目录复制到项目的 `.opencode/skills/` 中
2. 根据需要修改权限配置
3. 在对话中自然提及相关任务，Skills 将自动激活

```bash
git clone https://github.com/anthropics/skills.git
cp -r skills/skills/frontend-design .opencode/skills/
```

## UI UX Pro Max Skill

[UI UX Pro Max](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill) 是一个专注于 UI/UX 设计智能的 Skill（82K+ Star），为 AI 提供完整的设计系统生成能力。

{% alertpanel info "核心数据" %}

- **161 条**行业推理规则（覆盖 SaaS、金融、医疗、电商、游戏等）
- **67 种** UI 风格（Glassmorphism、Neubrutalism、Bento Grid、Brutalism 等）
- **161 套**行业配色方案
- **57 种**字体组合（含 Google Fonts 导入）
- **15 种**技术栈支持（React、Vue、Flutter、SwiftUI 等）
- **99 条** UX 最佳实践与反模式指南

{% endalertpanel %}

### 安装（OpenCode）

```bash
npm install -g uipro-cli
cd /path/to/project
uipro init --ai opencode
```

### 工作原理

当你描述 UI 需求时，Skill 会自动进行多维度搜索：

```
用户请求: "为我的美容水疗中心设计一个落地页"
          │
          ▼
┌─────────────────────────────────────┐
│  并行搜索（5 个维度）                  │
│  • 产品类型匹配（161 类别）            │
│  • 风格推荐（67 风格）                 │
│  • 色彩方案（161 调色板）              │
│  • 落地页模式（24 模式）               │
│  • 字体组合（57 搭配）                 │
└─────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────┐
│  推理引擎输出完整设计系统               │
│  • 推荐布局模式                        │
│  • 推荐 UI 风格                        │
│  • 配色方案 + 字体搭配                  │
│  • 动效建议 + 需避免的反模式            │
│  • 交付前检查清单                      │
└─────────────────────────────────────┘
```

### 支持的 67 种 UI 风格（部分）

| 风格 | 适用场景 |
| --- | --- |
| Minimalism & Swiss Style | 企业应用、仪表盘 |
| Glassmorphism | 现代 SaaS、金融仪表盘 |
| Neumorphism | 健康应用、冥想平台 |
| Brutalism | 设计作品集、艺术项目 |
| Bento Box Grid | 产品页、个人主页 |
| Neubrutalism | Gen Z 品牌、创业公司 |
| AI-Native UI | AI 产品、聊天机器人 |
| Dark Mode (OLED) | 夜间模式应用 |
| Claymorphism | 教育应用、儿童应用 |
| Spatial UI (VisionOS) | 空间计算、VR/AR |

### 使用示例

直接自然语言描述即可，Skill 自动激活：

```
为我的 SaaS 产品创建一个落地页

设计一个医疗健康数据分析仪表盘

做一个暗色主题的 Fintech 银行应用 UI
```

### 设计系统持久化

使用 Master + Overrides 模式在不同会话间保持设计一致性：

```bash
python3 .opencode/skills/ui-ux-pro-max/scripts/search.py \
  "SaaS dashboard" --design-system --persist -p "MyApp"
```

生成的结构：

```
design-system/
├── MASTER.md           # 全局设计规范
└── pages/
    └── dashboard.md    # 页面级覆盖
```

## Superpowers

[Superpowers](https://github.com/obra/superpowers) 是一套完整的 AI 代理软件开发方法论（204K+ Star），由 Jesse Vincent（[obra](https://github.com/obra)）创建。它不是普通的 Skill 集合，而是从脑暴到交付的全流程工作体系。

{% alertpanel info "核心理念" %}

- **测试驱动开发（TDD）** — 永远先写测试
- **系统化方法** — 流程优于猜测
- **化繁为简** — 简单是首要目标
- **证据优于声明** — 先验证再宣布成功

{% endalertpanel %}

### 工作流程

Superpowers 将软件开发分解为 7 个标准阶段：

```
 1. brainstorming      脑暴阶段：通过苏格拉底式提问细化需求
         │
 2. using-git-worktrees  为功能创建隔离的 Git worktree 工作区
         │
 3. writing-plans       将工作拆分为 2-5 分钟可完成的小任务
         │              每项任务包含精确文件路径 + 完整代码 + 验证步骤
         │
 4. subagent-driven      启动子 Agent 逐个执行任务
    -development         进行两阶段审查（需求合规 + 代码质量）
         │
 5. test-driven          严格执行 RED-GREEN-REFACTOR 循环
    -development         删除测试前写的代码
         │
 6. requesting-          按严重级别报告问题，关键问题阻塞进度
    code-review
         │
 7. finishing-a-         验证测试 → 合并/PR/保留/丢弃
    development-branch
```

### Skills 库

**测试与调试：**

| Skill | 功能 |
| --- | --- |
| test-driven-development | RED-GREEN-REFACTOR 完整循环，含反模式参考 |
| systematic-debugging | 4 阶段根因分析流程 |
| verification-before-completion | 确保问题真正修复 |

**协作与规划：**

| Skill | 功能 |
| --- | --- |
| brainstorming | 苏格拉底式设计优化 |
| writing-plans | 详细实施计划（精确到文件路径和代码） |
| executing-plans | 批量执行 + 人工检查点 |
| subagent-driven-development | 子 Agent 派发 + 两阶段审查 |
| dispatching-parallel-agents | 并发子 Agent 工作流 |
| requesting-code-review | 提交前自查清单 |
| receiving-code-review | 响应审查反馈 |

**元技能：**

| Skill | 功能 |
| --- | --- |
| writing-skills | 创建新 Skills 的最佳实践指南 |
| using-superpowers | Superpowers 系统介绍 |

### 在 OpenCode 中安装

Superpowers 已原生支持 OpenCode，在 OpenCode 中输入以下指令即可安装：

```
Fetch and follow instructions from https://raw.githubusercontent.com/obra/superpowers/refs/heads/main/.opencode/INSTALL.md
```

## 三套 Skills 对比

| 维度 | anthropics/skills | UI UX Pro Max | Superpowers |
| --- | --- | --- | --- |
| 定位 | 通用 Skills 示范集 | 专注 UI/UX 设计 | 完整开发方法论 |
| 规模 | 18 个 Skills | 1 个大型 Skill | 15+ 个 Skills |
| 应用场景 | 文档、前端、测试、设计 | 界面设计与实现 | 软件开发全流程 |
| 适用 Agent | Claude Code、OpenCode 等 | 支持 17+ 种 AI 助手 | 支持 8+ 种 Agent |
| GitHub Star | 140K+ | 82K+ | 204K+ |
| 许可 | Apache 2.0 / 源码可见 | MIT | MIT |
| 激活方式 | 自动匹配 | 自动匹配 / 命令触发 | 自动匹配 |

## 自己编写 Skill

### 最简单的 Skill 模板

```
.opencode/skills/my-skill/
└── SKILL.md
```

```markdown
---
name: my-skill
description: 当用户需要 XXX 时使用此技能，提供 YYY 功能
---

## 功能说明
- 做什么
- 不做什么

## 工作流程
1. 第一步
2. 第二步

## 注意事项
- 要点 1
- 要点 2
```

### 编写建议

1. **`description` 尽量具体** — Agent 靠它判断何时加载，模糊的描述导致 Skill 被误触发或漏触发
2. **指令要精确** — 把 Agent 当成人来写指令，给出明确的是 / 否判断标准
3. **附带脚本时用 `--help` 模式** — 让 Agent 先执行 `python script.py --help` 再决定如何使用，避免加载大段源码污染上下文
4. **实际测试** — `hexo generate` 前先 `hexo s --draft` 预览草稿，Skill 也需要在实际场景中验证效果

## 参考链接

- [OpenCode Skills 文档](https://opencode.ai/docs/skills/)
- [anthropics/skills](https://github.com/anthropics/skills)
- [UI UX Pro Max Skill](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill)
- [Superpowers](https://github.com/obra/superpowers)
- [Agent Skills 规范](https://agentskills.io)
