---
title: Git
date: 2025-01-03 20:00:00
categories: 命令行工具
tags:
  - tools
sticky: 0
#cover:
comments: true
toc: true
---

Git 的常用命令与配置整理，涵盖日常开发中的基本操作。

<!-- more -->

## 基本配置

安装 Git 后，首先设置用户名和邮箱：

```sh
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

{% alertpanel info "配置级别" %}
Git 配置有三个级别：

| 级别 | 作用范围 | 配置文件 |
|------|---------|---------|
| `--local` | 当前仓库（默认） | `.git/config` |
| `--global` | 当前用户所有仓库 | `~/.gitconfig` |
| `--system` | 系统所有用户 | `/etc/gitconfig` |

优先级：local > global > system
{% endalertpanel %}

其他常用配置：

```sh
# 设置默认分支名（替代 master）
git config --global init.defaultBranch main

# 设置编辑器
git config --global core.editor "code --wait"

# Windows 下关闭换行符自动转换警告
git config --global core.autocrlf false

# 查看所有配置
git config --list
```

## 基本工作流

### 初始化 / 克隆仓库

```sh
# 在当前目录初始化
git init

# 克隆远程仓库
git clone https://github.com/user/repo.git
git clone git@github.com:user/repo.git
```

### 日常提交流程

```sh
# 查看仓库状态
git status

# 查看文件具体改动
git diff

# 将文件加入暂存区
git add <file>          # 添加指定文件
git add .               # 添加所有改动

# 提交到本地仓库
git commit -m "commit message"

# 推送到远程仓库
git push origin main
```

{% alertpanel info "commit message 规范" %}
推荐使用 [Conventional Commits](https://www.conventionalcommits.org/) 规范：

```
<type>(<scope>): <subject>

feat: 新功能
fix: 修复 bug
docs: 文档更新
style: 代码格式调整
refactor: 重构
chore: 构建/工具变更
```
{% endalertpanel %}

## 分支管理

```sh
# 查看分支列表
git branch                 # 本地分支
git branch -r              # 远程分支
git branch -a              # 所有分支

# 创建分支
git branch <branch-name>

# 切换分支
git checkout <branch-name>
git switch <branch-name>          # Git 2.23+ 推荐用法

# 创建并切换到新分支
git checkout -b <branch-name>
git switch -c <branch-name>

# 合并分支（将目标分支合并到当前分支）
git merge <branch-name>

# 变基（将当前分支的提交接到目标分支之后）
git rebase <branch-name>

# 删除分支
git branch -d <branch-name>       # 安全删除（已合并）
git branch -D <branch-name>       # 强制删除

# 删除远程分支
git push origin --delete <branch-name>
```

{% alertpanel info "merge vs rebase" %}

- **merge**：保留完整的分支历史，会产生合并提交
- **rebase**：使提交历史更线性整洁，但会改写提交历史

{% mermaid %}
gitGraph
   commit id: "A"
   commit id: "B"
   branch feature
   checkout feature
   commit id: "C"
   checkout main
   commit id: "D"
   checkout feature
   commit id: "E"
{% endmermaid %}

{% endalertpanel %}

## 查看历史

```sh
# 查看提交历史
git log

# 简洁的单行显示
git log --oneline

# 图形化显示分支历史
git log --oneline --graph --all

# 查看某个文件的改动历史
git log -p <file>

# 查看某次提交的具体内容
git show <commit-hash>

# 查看谁改动了哪些行（类似 blame）
git blame <file>
```

## 撤销操作

```sh
# 撤销工作区的改动（恢复为最近一次提交的状态）
git restore <file>                # Git 2.23+
git checkout -- <file>            # 旧写法

# 将文件从暂存区撤回到工作区
git restore --staged <file>       # Git 2.23+
git reset HEAD <file>             # 旧写法

# 回退提交（保留工作区改动）
git reset --soft HEAD~1

# 回退提交（保留工作区改动，清空暂存区）
git reset --mixed HEAD~1          # 默认行为

# 回退提交（完全丢弃改动）
git reset --hard HEAD~1

# 创建新提交来撤销某次提交（安全，不改写历史）
git revert <commit-hash>
```

{% alertpanel warning "reset --hard 警告" %}
`git reset --hard` 会**永久丢失**工作区和暂存区的未提交改动，使用前请确认。
{% endalertpanel %}

## 暂存改动

当需要切换分支但当前改动又不想提交时，使用 `stash`：

```sh
# 暂存当前所有改动
git stash

# 暂存时附带说明
git stash push -m "描述信息"

# 查看暂存列表
git stash list

# 恢复最近一次暂存（不删除 stash 记录）
git stash apply

# 恢复最近一次暂存（删除 stash 记录）
git stash pop

# 删除最近一次暂存
git stash drop

# 清空所有暂存
git stash clear
```

## 远程仓库

```sh
# 查看远程仓库
git remote -v

# 添加远程仓库
git remote add origin <url>
git remote add upstream <url>

# 修改远程仓库地址
git remote set-url origin <new-url>

# 删除远程仓库
git remote remove upstream

# 拉取远程分支（不合并）
git fetch origin

# 拉取并合并到当前分支
git pull origin main

# 拉取并变基
git pull --rebase origin main
```

## 标签

```sh
# 创建轻量标签
git tag v1.0.0

# 创建附注标签（含说明信息）
git tag -a v1.0.0 -m "Release v1.0.0"

# 查看所有标签
git tag

# 推送标签到远程
git push origin v1.0.0          # 推送单个标签
git push origin --tags           # 推送所有标签

# 删除标签
git tag -d v1.0.0                # 本地删除
git push origin --delete v1.0.0  # 远程删除

# 切换到某个标签（只读）
git checkout v1.0.0
```

## .gitignore

在项目根目录创建 `.gitignore` 文件，指定不需要版本控制的文件：

```gitignore
# 依赖目录
node_modules/

# 构建输出
public/
dist/

# 环境变量
.env
.env.local

# 系统文件
.DS_Store
Thumbs.db

# IDE 配置
.vscode/
.idea/
```

## 代理

{% alertpanel info "先决条件" %}

- 已有代理服务器(http/socks 其一)
  - http: `http://proxy.address:8080`
  - socks: `socks5://proxy.address:1080`
    {% endalertpanel %}

### 拉取 http(s)链接远程仓库地址

```sh
# 1. http代理的情况
git config --global http.proxy 'http://proxy.address:8080'
git config --global https.proxy 'http://proxy.address:8080'

# 2. socks代理的情况
git config --global http.proxy 'socks5://proxy.address:1080'
git config --global https.proxy 'socks5://proxy.address:1080'

# 3. 取消代理
git config --global --unset http.proxy
git config --global --unset https.proxy
```

命令执行完成后,可以在`$HOME/.gitconfig`文件发现多了 2 条配置项目

```conf
[http]
proxy = socks5://proxy.address:1080
[https]
proxy = socks5://proxy.address:1080
```

### 拉取 ssh 链接远程仓库地址

macOS/Linux: 修改`~/.ssh/config`,不存在则新建

```
Host github.com
    HostName github.com
    User git
    # 走 HTTP 代理
    ProxyCommand nc -X connect -x roxy.address:8080 %h %p
    # 走 socks5 代理(写法1)
    ProxyCommand nc -X 5 -x roxy.address:1080 %h %p
    # 走 socks5 代理(写法2)
    ProxyCommand nc -x roxy.address:1080 %h %p
```

{% alertpanel info "解释" %}

- `Host`后面接的`github.com`是指定要走代理的仓库域名。
- 在`ProxyCommand`中，Linux 和 macOS 用户用的是 nc。
- `-X`选项后面接的是`connect`的意思是 HTTPS 代理。
  - 如果`-X`选项后面接的是数字 5，那么指的就是 socks5 代理。
  - 当然直接不写上`-X`选项也是可以的，因为在没有指定协议的情况下，默认是使用 socks5 代理的。
- `-x`选项后面加上代理地址和端口号。
- 在调用`ProxyCommand`时，`％h`和`％p`将会被自动替换为**目标主机名**和**SSH 命令指定的端口**
  - `%h`和`%p`不要修改，保留原样即可。

{% endalertpanel %}

Windows: 修改`%HOMEPATH%\.ssh\config`,不存在则新建(connect.exe 已随 git 一同安装)

```
Host github.com
    User git
    # 走 HTTP 代理
    ProxyCommand connect.exe -H proxy.address:8080 %h %p
    # 走 socks 代理
    ProxyCommand connect.exe -S proxy.address:1080 %h %p
```

{% alertpanel info "解释" %}

- `Host`后面接的`github.com`是指定要走代理的仓库域名。
- 在`ProxyCommand`中,Windows 用户用的是`connect`。
- `-H`选项的意思是 HTTP 代理。
  - 单独的`-S`选项指的就是 socks5 代理
- 在调用`ProxyCommand`时，`％h`和`％p`将会被自动替换为**目标主机名**和**SSH 命令指定的端口**
  - `%h`和`%p`不要修改，保留原样即可。

{% endalertpanel %}

windows 使用需要使用用户名密码的 HTTP 代理服务情况下

```
Host github.com
    User git
    ProxyCommand env CONNECT_USER=username CONNECT_PASSWORD=password connect.exe -H proxy.address:8080 %h %p
```
