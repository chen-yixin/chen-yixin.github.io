---
title: Rclone 使用指南——云存储的瑞士军刀
date: 2026-07-31 12:00:00
categories:
  - 命令行工具
tags:
  - tools
  - cloud
  - rclone
  - backup
  - sync
description: Rclone 是一个开源的命令行云存储管理工具，支持 70+ 云存储服务商，提供同步、挂载、加密、服务暴露等功能。本文涵盖从安装配置到高级用法（加密、Union 合并、双向同步等）的完整指南。
keywords:
  - rclone
  - rclone教程
  - 云存储同步
  - rclone加密
  - rclone挂载
comments: true
toc: true
donate: true
share: true
---

## 为什么要了解 Rclone？

如果你用过多个云存储（Google Drive、OneDrive、Dropbox、S3……），大概率遇到过这些场景：

- 想把文件从 Google Drive 迁移到 OneDrive，但官方工具不支持直接传输
- 想把云盘挂载成电脑上的一个盘符，像本地硬盘一样使用
- 想给云盘上的敏感文件加一层客户端加密，而不是依赖服务商的"承诺"
- 想用脚本自动化备份，而不是每次手动打开网页拖拽
- 想把多个免费云盘的空间合并成一个统一的存储池

这些问题，**Rclone 都能解决**。它是云存储领域的"瑞士军刀"——一个命令行工具，统一了 70+ 云存储服务的操作接口。

{% alertpanel info "Rclone 是什么？" %}

Rclone 是一个使用 Go 语言编写的开源命令行程序，被称为 **"云存储的 rsync"**。它在 70+ 云存储提供商之上提供了一个统一的操作界面，支持文件同步、复制、挂载为本地磁盘、通过 HTTP/WebDAV/FTP/SFTP 暴露服务等功能。

- 官网：[rclone.org](https://rclone.org)
- GitHub：[rclone/rclone](https://github.com/rclone/rclone)（50K+ Star）
- 许可协议：MIT
- 当前版本：v1.74.0（2026 年 5 月）

{% endalertpanel %}

<!-- more -->

## 安装

Rclone 支持 Linux、macOS、Windows、FreeBSD 等主流平台。

### Linux

```bash
# Debian/Ubuntu
sudo apt install rclone

# 或使用官方安装脚本
curl https://rclone.org/install.sh | sudo bash
```

### macOS

```bash
brew install rclone
```

### Windows

```bash
# 使用 Chocolatey
choco install rclone

# 或使用 Winget
winget install Rclone.Rclone
```

也可以从 [rclone.org/downloads](https://rclone.org/downloads/) 下载对应平台的预编译二进制文件，解压后直接使用。

## 配置远程存储

安装后的第一步是配置要连接的云存储服务（rclone 称之为 `remote`）。

```bash
rclone config
```

这会启动一个交互式的配置向导：

1. 输入 `n` 创建新 remote
2. 输入名字（如 `gdrive`、`onedrive`、`s3-backup`）
3. 从列表中选择存储类型（输入编号或关键词搜索）
4. 按提示完成认证（大多数服务需要 OAuth 授权，会在浏览器中打开登录页面）

配置完成后，可以用以下命令查看已配置的 remote：

```bash
rclone listremotes
```

{% alertpanel warning "注意" %}

对于 **无桌面环境的服务器**（如 VPS、NAS），OAuth 认证可能无法直接弹窗。通常的做法是：在本地有浏览器的机器上执行 `rclone config` 完成认证，然后将生成的 `rclone.conf` 文件复制到服务器。

配置文件位置：
- Linux/macOS：`~/.config/rclone/rclone.conf`
- Windows：`%USERPROFILE%\.config\rclone\rclone.conf`

{% endalertpanel %}

配置文件也支持加密存储敏感凭证，通过 `rclone config` 中的 `Set configuration password` 选项设置密码即可。

## 核心命令

Rclone 的命令体系类似于 Unix 工具链，对熟悉命令行的用户非常友好。路径格式统一为 `remote:路径`，本地路径直接使用绝对或相对路径。

### `rclone copy` — 增量复制

最常用的安全操作，**只复制新的或已变更的文件，绝不删除目标文件**。

```bash
# 基本用法
rclone copy /local/photos gdrive:photos

# 只复制最近 24 小时修改的文件
rclone copy --max-age 24h /local/photos gdrive:photos

# 带进度条和详细日志
rclone copy /local/data s3:my-bucket -P -v

# 只复制比目标新的文件
rclone copy --update /local/data remote:backup
```

适用场景：日常备份、增量上传、追加式归档。

### `rclone sync` — 单向镜像

使目标与源**完全一致**——会删除目标中源不存在的文件。

```bash
# ⚠️ 建议首次使用先 dry-run
rclone sync /local/data remote:backup --dry-run -v

# 确认无误后执行
rclone sync /local/data remote:backup -P

# 开启交互模式，每次删除前确认
rclone sync /local/data remote:backup --interactive

# 删除的文件先移到备份目录，而非直接删除
rclone sync /local/data remote:backup --backup-dir remote:deleted-backup
```

{% alertpanel danger "sync vs copy" %}

| 操作 | 复制新/变更文件 | 删除目标多余文件 | 安全性 |
|------|:---:|:---:|------|
| `rclone copy` | ✅ | ❌ | 高 — 不会丢数据 |
| `rclone sync` | ✅ | ✅ | 需谨慎 — 会删除目标文件 |

**建议**：重要数据永远先用 `--dry-run` 预览，确认后再执行。日常备份优先用 `copy`。

{% endalertpanel %}

### `rclone mount` — 挂载为本地磁盘

将云存储挂载为本地文件系统，像操作本地硬盘一样读写云端文件。

```bash
# 创建挂载点
mkdir ~/cloud-drive

# 挂载 Google Drive
rclone mount gdrive: ~/cloud-drive --vfs-cache-mode writes

# 后台运行
rclone mount onedrive: ~/onedrive --vfs-cache-mode writes --daemon

# 只读挂载（更安全）
rclone mount s3:my-bucket ~/s3-mount --read-only

# Windows 下挂载为盘符 X:
rclone mount gdrive: X: --vfs-cache-mode writes
```

**VFS 缓存模式**（`--vfs-cache-mode`）决定了读写性能和一致性：

| 模式 | 说明 | 适用场景 |
|------|------|----------|
| `off` | 无缓存，每次操作直接访问远端 | 网络好、文件小 |
| `minimal` | 最小缓存 | 读多写少 |
| `writes` | 缓存写入操作 | 有写入需求的日常使用 |
| `full` | 全缓存（读写均在本地缓存完成） | 频繁读写、大文件编辑 |

### `rclone bisync` — 双向同步

{% alertpanel warning "注意" %}

`bisync` 是实验性命令，使用前务必阅读[官方文档](https://rclone.org/bisync/)。

{% endalertpanel %}

双向同步解决的是"两个位置都可能有变更，需要保持一致"的问题。典型场景：笔记本和台式机之间通过云盘同步工作文件夹。

```bash
# ⚠️ 首次运行必须使用 --resync 建立基线
rclone bisync /local/work gdrive:work --resync --dry-run

# 确认无误后执行
rclone bisync /local/work gdrive:work --resync

# 后续正常运行（不要加 --resync！）
rclone bisync /local/work gdrive:work \
  --resilient --recover --max-lock 2m \
  --conflict-resolve newer \
  --check-access \
  -MvP
```

**关键参数说明**：

| 参数 | 说明 |
|------|------|
| `--resync` | **仅首次使用**，以 Path1 为准建立基线 |
| `--resilient` | 非致命错误后允许重试，无需重新 resync |
| `--recover` | 中断后自动恢复 |
| `--max-lock 2m` | 锁文件自动过期时间（适合 cron 定时任务） |
| `--conflict-resolve newer` | 冲突时自动选择较新版本 |
| `--check-access` | 运行前验证两端均可访问（安全措施） |
| `--max-delete` | 删除比例安全上限（默认 50%） |

冲突处理策略：当同一文件在两端都发生了变更时，默认将一端重命名为 `.conflict1`/`.conflict2` 后缀保留，不会静默覆盖。

### `rclone check` — 完整性校验

检查源和目标是否一致，不传输任何数据。

```bash
# 比对文件数量和大小
rclone check /local/data remote:backup

# 对比 checksum（更准确，但更慢）
rclone check /local/data remote:backup --checksum

# 只输出差异
rclone check /local/data remote:backup --one-way
```

### `rclone serve` — 暴露为服务

将云存储通过标准协议暴露出来，无需挂载：

```bash
# 通过 WebDAV 暴露（适合 Finder、Cyberduck 等客户端）
rclone serve webdav gdrive:/Documents --addr 127.0.0.1:8888 \
  --user admin --pass mypassword

# 通过 HTTP 暴露只读文件（分享用）
rclone serve http s3:public-bucket --addr :8080

# 通过 SFTP 暴露（安全的远程访问）
rclone serve sftp gdrive: --addr :2022 --user user --pass pass

# 通过 S3 协议暴露（让其他 S3 工具访问任意云存储）
rclone serve s3 gdrive:/Backups --addr :9000 \
  --auth-key ACCESSKEY,SECRETKEY
```

### 其他常用命令

| 命令 | 说明 |
|------|------|
| `rclone ls remote:` | 列出文件（含大小） |
| `rclone lsd remote:` | 只列目录 |
| `rclone tree remote:` | 树形展示目录结构 |
| `rclone lsf remote:` | 机器可读格式（适合脚本） |
| `rclone delete remote:file` | 删除文件 |
| `rclone purge remote:dir` | 删除目录（含所有内容） |
| `rclone move /local remote:` | 移动（复制后删除源文件） |
| `rclone mkdir remote:dir` | 创建目录 |
| `rclone size remote:` | 计算大小 |
| `rclone cleanup remote:` | 清理垃圾/版本历史 |
| `rclone about remote:` | 查看存储配额 |

## 进阶功能

### 加密后端 — Crypt

Crypt 是 rclone 最强大的功能之一。它在数据上传到云端之前进行**客户端透明加密**，服务商永远看不到明文内容。

```bash
# 先创建一个普通 remote（如 gdrive）
rclone config  # 配置好 Google Drive

# 再创建一个 crypt 类型的 remote，底层指向 gdrive 的某个子目录
rclone config
# > n → 名字: gdrive-crypt
# > 类型: crypt
# > 底层 remote: gdrive:/encrypted-data
# > 设置加密密码和盐值
```

之后，所有对 `gdrive-crypt:` 的读写操作都会自动加解密：

```bash
# 写入时自动加密
rclone copy ~/机密文档 gdrive-crypt:docs

# 读取时自动解密
rclone copy gdrive-crypt:docs ~/恢复的文档

# 在网页端只能看到加密后的乱码文件名和文件内容
```

**典型用法**：同一个云盘，创建两个 remote：
- `gdrive:` — 日常文件，不加密
- `gdrive-crypt:` — 敏感文件，客户端加密

### Union 后端 — 合并多个云盘

将多个云盘的存储空间合并为一个逻辑卷。当你有 Google Drive（15GB 免费）、OneDrive（5GB 免费）、MEGA（20GB 免费）时：

```bash
rclone config
# 创建 union 类型 remote
# 底层 remotes: gdrive: onedrive: mega:
# 写入策略(upstream_policy): epmfs
```

**写入策略选项**：

| 策略 | 行为 |
|------|------|
| `epmfs` | 同目录文件优先放在同一个云盘，选剩余空间最多的 |
| `eplfs` | 同目录文件优先放在同一个云盘，选剩余空间最少的 |
| `lfs` | 选剩余空间最少的（先填满小的） |
| `mfs` | 选剩余空间最多的（均匀分布） |
| `rand` | 随机选择 |

```bash
# 挂载合并后的存储
rclone mount union-remote: ~/all-clouds --vfs-cache-mode writes
```

### 跨云盘直接传输（Server-Side Copy）

当源和目标都是支持服务端复制的云存储时，数据在云服务商之间直接传输，**不经过本地网络**。

```bash
# Google Drive → OneDrive，数据在云端直传
rclone copy gdrive:files onedrive:backup

# S3 → B2
rclone sync s3:my-bucket b2:my-bucket --verbose
```

这在迁移大量数据时特别有用——不需要先把数据下载到本地再上传。

### 带宽控制

```bash
# 限制上下行速度
rclone copy /local remote: --bwlimit 1M

# 分别限制上行和下行
rclone copy /local remote: --bwlimit 2M:500k

# 在特定时间段限制（如白天限速，夜间全速）
rclone copy /local remote: --bwlimit "08:00,1M 18:00,off"
```

### 定时任务自动化

```bash
# crontab 示例

# 每小时备份项目目录到云盘
0 * * * * rclone sync /home/user/projects gdrive:backup/projects \
  --log-file /var/log/rclone/projects.log

# 每天凌晨 2 点完整备份
0 2 * * * rclone sync /home/user gdrive-crypt:full-backup \
  --backup-dir gdrive-crypt:deleted/$(date +\%Y\%m\%d) \
  --log-file /var/log/rclone/daily.log

# 每 30 分钟双向同步工作文件夹
*/30 * * * * rclone bisync /home/user/work gdrive:work \
  --resilient --recover --max-lock 5m \
  --conflict-resolve newer --check-access \
  --log-file /var/log/rclone/bisync.log
```

## 典型使用场景

### 场景一：个人文件增量备份

这是最简单也最安全的用法。使用 `copy` 而非 `sync`，确保不会意外删除云端文件。

```bash
# 每日备份脚本
#!/bin/bash
RCLONE_REMOTE="b2:family-backup"
SOURCE="/home/user/photos"

rclone copy "$SOURCE" "$RCLONE_REMOTE/photos" \
  --max-age 7d \
  --update \
  --verbose \
  --log-file "/var/log/rclone/photos-$(date +%Y%m%d).log"

echo "备份完成"
```

### 场景二：NAS 数据同步到 S3 冷存储

将家庭 NAS 中的重要数据同步到 AWS S3 Glacier Deep Archive，实现异地容灾。配合 rclone 的 `--backup-dir` 可以保留被删除文件的归档。

```bash
rclone sync /mnt/nas/important s3:disaster-recovery \
  --backup-dir s3:deleted-archive/$(date +%Y-%m) \
  --log-file /var/log/rclone/nas-dr.log \
  --log-level INFO
```

### 场景三：Google Drive 挂载为本地硬盘

在没有官方客户端的 Linux 服务器上，把 Google Drive 当作本地文件系统使用。

```bash
# systemd service 示例：/etc/systemd/system/rclone-gdrive.service
[Unit]
Description=Rclone Google Drive Mount
After=network-online.target

[Service]
Type=notify
ExecStart=/usr/bin/rclone mount gdrive: /mnt/gdrive \
  --config /home/user/.config/rclone/rclone.conf \
  --vfs-cache-mode writes \
  --allow-other \
  --dir-cache-time 5m
ExecStop=/bin/fusermount -uz /mnt/gdrive
Restart=on-failure
User=user
Group=user

[Install]
WantedBy=multi-user.target
```

### 场景四：端到端加密的敏感文件存储

在雇主提供的 Google Drive 上存储个人密码库、证件扫描件等敏感文件。

```bash
# 使用 crypt 加密层
rclone copy ~/passwords.kdbx gdrive-crypt:
rclone copy ~/scans/ gdrive-crypt:documents/
```

在云盘网页端，只能看到加密后的文件名（如 `a7f3c9d2e1b4.bin`），文件内容也是密文。

### 场景五：跨云盘大文件迁移

将 500GB 的 OneDrive 数据迁移到 Backblaze B2，数据在云端直传，不经过本地网络。

```bash
rclone copy onedrive: b2:archive \
  --progress \
  --transfers 8 \
  --log-file ~/migration.log
```

### 场景六：通过 Rclone 暴露 S3 兼容接口

如果你内部的服务只支持 S3 协议，但实际存储是 Google Drive，可以用 `rclone serve s3` 做协议转换。

```bash
# 启动 S3 兼容 API 网关
rclone serve s3 gdrive:/bucket \
  --addr 0.0.0.0:9000 \
  --auth-key my-access-key,my-secret-key
```

然后用 AWS CLI 或任何 S3 SDK 直接操作 Google Drive：

```bash
aws s3 ls s3://bucket/ --endpoint-url http://localhost:9000
```

## 支持的后端一览

Rclone 支持 70+ 云存储后端，按维护级别分为五级：

{% alertpanel success "Tier 1 — 生产级核心后端" %}

**本地**、**Amazon S3**（及所有 S3 兼容服务如 Cloudflare R2、MinIO）、**Google Drive**、**OneDrive**、**Dropbox**、**Backblaze B2**、**Box**、**Google Cloud Storage**、**Azure Blob**、**SFTP**、**WebDAV**、**FTP**、**Swift**、**Storj**、**Yandex Disk**、**pCloud**、**Oracle Object Storage**、**Crypt**（加密层）、**Union**（合并层）等

{% endalertpanel %}

{% alertpanel info "Tier 2 — 稳定后端" %}

**Azure Files**、**SMB/CIFS**、**Mega**、**HDFS**、**Jottacloud**、**Koofr**、**Put.io** 等

{% endalertpanel %}

其他 Tier 3/4 的实验性后端还包括 **Proton Drive**、**Internet Archive**、**iCloud Drive**、**Seafile** 等。

## 常用选项速查

| 选项 | 说明 |
|------|------|
| `-P` / `--progress` | 显示实时传输进度 |
| `-v` / `--verbose` | 详细输出 |
| `--dry-run` | 模拟运行，不实际执行 |
| `--interactive` / `-i` | 删除前逐一确认 |
| `--checksum` / `-c` | 基于校验和而非修改时间判断差异 |
| `--update` / `-u` | 跳过目标中较新的文件 |
| `--max-age 24h` | 只处理过去 24 小时内修改的文件 |
| `--bwlimit 1M` | 限制带宽为 1MB/s |
| `--transfers 8` | 并发传输 8 个文件 |
| `--multi-thread-streams 4` | 大文件 4 线程并行下载 |
| `--backup-dir` | 删除/覆盖的文件移至备份目录 |
| `--log-file` | 日志输出到文件 |
| `--config` | 指定配置文件路径 |

## 小结

Rclone 的价值在于**统一接口** —— 它把 70+ 云存储服务的差异性封装在一致的命令行界面之下。一旦掌握了基本命令，操作 Google Drive 和操作 S3 的感受几乎一样。

核心思路：

1. **日常备份用 `copy`** —— 安全、增量、不丢数据
2. **精确镜像用 `sync`** —— 始终先 dry-run
3. **本地化体验用 `mount`** —— 把云盘变成文件夹
4. **隐私保护用 `crypt`** —— 数据在上传前加密，密钥在自己手里
5. **空间整合用 `union`** —— 多个免费云盘合并成一个
6. **双向协作用 `bisync`** —— 两台机器保持工作目录一致

配合 cron 定时任务，它可以成为一套完整的个人/小团队数据管理基础设施。