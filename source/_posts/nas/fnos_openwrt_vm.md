---
title: 飞牛NAS部署OpenWRT虚拟机完整指南（apk版）
categories: NAS
top: false
comments: true
toc: true
date: 2026-05-24 22:00:00
tags:
  - fnOS
  - OpenWRT
  - 虚拟机
---

随着 OpenWRT 主线逐步从 `opkg` 迁移到 `apk` 作为默认包管理器，最新的快照版和即将发布的 25.xx 版本已全面采用 `apk`。本文记录飞牛 NAS（fnOS）虚拟机部署 OpenWRT 旁路由的过程，并同步适配 apk 包管理命令。

之前写过一篇 [opkg 版部署记录](/posts/nas/fnos_openwt/)，本文在其基础上更新。

<!-- more -->

## 配置目标

- 主路由：使用硬路由
  - 职责：拨号、网关、DHCP
  - IP：`192.168.100.1`
- 飞牛 NAS 的 OpenWRT 虚拟机
  - 职责：旁路由
  - 关闭 DHCP
  - 关闭 IPv6 协议栈
  - IP：`192.168.100.10`
- 上网设备
  - 普通设备：正常连接网络即可，不做配置
  - 需要 OpenWRT 作为网关的设备：网关设置为 `192.168.100.10`

## 虚拟机创建

1. **下载 OpenWRT 镜像**
   - 下载最新的 OpenWRT 镜像
   - URL：[OpenWRT x86_64](https://downloads.openwrt.org/releases/)
   - 如果使用 apk 版，需选择 **snapshots** 目录下的镜像，或等待 25.xx 正式版
   - 推荐下载 `generic-squashfs-combined-efi.img.gz`（不要解压）
   - 也可以下载 `generic-ext4-combined-efi.img.gz`（ext4 格式，可扩容）

2. **飞牛系统准备**
   - 网络设置中开启 OVS（虚拟机配置时会有引导提示）
   - 应用商店安装「虚拟机」应用

3. **新建虚拟机**
   - 虚拟机名称：例如 `OpenWRT`
   - 操作系统：`Linux`，`6.x - 2.6 Kernel`
   - 系统镜像：`generic-squashfs-combined-efi.img.gz`（⚠️ gz 包不要解压，直接使用）
   - 资源配置参考：
     - 固件：UEFI
     - CPU 类型：硬件虚拟化
     - CPU 核心：1 核
     - 内存分配：512MB
     - 磁盘类型：SATA
     - 网络类型：Intel E1000

## OpenWRT 初期配置

虚拟机开机后通过 VNC 进入终端。

### 配置静态 IP

```bash
vi /etc/config/network
```

找到 `config interface 'lan'` 段，修改：

```
option ipaddr '192.168.100.10'
option gateway '192.168.100.1'
list dns '192.168.100.1'
```

重启网络或重启虚拟机使配置生效。

### 镜像源修改

如果使用 **snapshots 版本（apk 版）**，镜像源配置文件路径不同：

```bash
# opkg 版（24.xx 及之前）
vi /etc/opkg/distfeeds.conf

# apk 版（snapshots / 25.xx+）
vi /etc/apk/repositories.d/openwrt.list
```

以南京大学镜像站为例：

**opkg 版：**

```bash
cp /etc/opkg/distfeeds.conf /etc/opkg/distfeeds.conf.bak
sed -i 's_https\?://downloads.openwrt.org_https://mirror.nju.edu.cn/openwrt_' /etc/opkg/distfeeds.conf
opkg update
```

**apk 版：**

```bash
cp /etc/apk/repositories.d/openwrt.list /etc/apk/repositories.d/openwrt.list.bak
# 编辑替换为镜像源
vi /etc/apk/repositories.d/openwrt.list
```

将内容替换为：

```
https://mirror.nju.edu.cn/openwrt/snapshots/packages/aarch64_cortex-a53/base
https://mirror.nju.edu.cn/openwrt/snapshots/packages/aarch64_cortex-a53/packages
https://mirror.nju.edu.cn/openwrt/snapshots/packages/aarch64_cortex-a53/luci
https://mirror.nju.edu.cn/openwrt/snapshots/packages/aarch64_cortex-a53/routing
https://mirror.nju.edu.cn/openwrt/snapshots/packages/aarch64_cortex-a53/telephony
```

> 注意：apk 源地址中的架构部分请根据实际 CPU 架构修改，x86_64 对应 `x86_64`。

更新：

```bash
apk update
```

### 安装中文语言包

**opkg 版：**

```bash
opkg install luci-i18n-base-zh-cn
```

**apk 版：**

```bash
apk add luci-i18n-base-zh-cn
```

### 安装 Argon 主题（可选）

**opkg 版：**

```bash
opkg install luci-compat luci-lib-ipkg
# 下载 luci-theme-argon*.ipk 后
opkg install luci-theme-argon*.ipk
```

**apk 版：**

```bash
apk add luci-compat
# apk 下安装本地 ipk 包：
apk add --allow-untrusted luci-theme-argon*.ipk
```

或直接通过 LuCI 界面在线安装：

```bash
apk add luci-theme-argon
```

## 关闭 DHCP（旁路由模式）

- 登录 LuCI → 网络 → 接口
- 找到 LAN → 点「修改」
- 切换到 **DHCP 服务器** 标签页
- 勾选「忽略此接口」（Disable DHCP for this interface）
- 保存并应用

> 结果：主路由继续负责分配 IP，OpenWRT 不参与 DHCP。

## 关闭 IPv6 协议栈

- 网络 → 接口 → LAN → 修改
- 切到 **DHCP 服务器** → **IPv6 设置**
- 将三项全部设为「已禁用」：
  - RA 服务：已禁用
  - DHCPv6 服务：已禁用
  - NDP 代理：已禁用
- 保存并应用

> 如存在 `wan6` 接口，一并删除或禁用。

## 用 dnsmasq-full 替代内置 dnsmasq

**opkg 版：**

```bash
opkg install dnsmasq-full --force-overwrite
opkg list-installed | grep dnsmasq
/etc/init.d/dnsmasq restart
```

**apk 版：**

```bash
# 先移除原版 dnsmasq
apk del dnsmasq
# 安装 dnsmasq-full
apk add dnsmasq-full
# 验证
apk list -I | grep dnsmasq
# 重启服务
service dnsmasq restart
```

## 安装代理工具

- 操作步骤
  - 下载插件本体
    - 前往 Github ,并按照说明下载安装
    - URL: [releases](https://github.com/vernesong/OpenClash/releases)
  - 下载内核
    - 前往 Github ,并按照说明下载
    - URL: [releases](https://github.com/MetaCubeX/mihomo/releases)
    - 解压后重命名为`clash_meta`
    - 放置在`/etc/openclash/core`
  - 其他配置并启动

## apk vs opkg 常用命令对照

| 操作         | opkg                      | apk                                    |
| ------------ | ------------------------- | -------------------------------------- |
| 更新源       | `opkg update`             | `apk update`                           |
| 安装包       | `opkg install <pkg>`      | `apk add <pkg>`                        |
| 移除包       | `opkg remove <pkg>`       | `apk del <pkg>`                        |
| 列出已安装   | `opkg list-installed`     | `apk list -I`                          |
| 搜索包       | `opkg find <pkg>`         | `apk search <pkg>`                     |
| 查看包信息   | `opkg info <pkg>`         | `apk info <pkg>`                       |
| 安装本地 ipk | `opkg install <file>.ipk` | `apk add --allow-untrusted <file>.ipk` |
| 强制覆盖     | `--force-overwrite`       | 默认行为，冲突时会提示                 |

## 参考

- [飞牛论坛原帖 - 虚拟机安装OpenWRT](https://club.fnnas.com/forum.php?mod=viewthread&tid=42069)
- [OpenWRT 官方镜像下载](https://downloads.openwrt.org/releases/)
- [南京大学 OpenWRT 镜像源](https://help.mirror.nju.edu.cn/openwrt/)
