---
title: 飞牛NAS虚拟机部署OpenWRT作为旁路由
categories: NAS
top: false
comments: true
toc: true
date: 2025-11-28 23:00:00
tags:
  - fnOS
  - OpenWRT
---

近期飞牛正式版发布，把小主机系统从 Windows Server 2022 改为 fnOS。
虚拟机安装 OpenWRT 作为旁路由使用。
发现飞牛论坛有篇帖子完全符合需求。
这里记录下搭建过程。

<!-- more -->

[参考来源](https://club.fnnas.com/forum.php?mod=viewthread&tid=42069)

## 配置目标

- 主路由: 使用硬路由
  - 职责: 拨号、网关、DHCP
  - IP: `192.168.100.1`
- 飞牛 NAS 的 OpenWRT 虚拟机
  - 职责: 旁路由
  - 关闭 DHCP
  - 关闭 IPv6 协议栈
  - IP: `192.168.100.10`
- 上网设备
  - 普通设备: 正常连接网络即可，不做配置
  - 需要 OpenWRT 作为网关的设备: 网关设置为`192.168.100.10`

## 虚拟机创建

- 下载 OpenWRT 官方镜像
  - 官方镜像下载: [OpenWRT x86_64](https://downloads.openwrt.org/releases/24.10.4/targets/x86/64/)
  - 选择一个镜像下载，例如：`generic-squashfs-combined-efi.img.gz`
- 飞牛系统网络设置, 把 OVS 打开(在虚拟机配置这步有引导)
- 应用商店内找到“虚拟机”并安装
- 打开“虚拟机”应用
- 新建虚拟机
  - 虚拟机名称: 例如`OpenWRT`
  - 操作系统: `Linux`, `6.x - 2.6 Kernel`
  - 系统镜像: `generic-squashfs-combined-efi.img.gz`
    - ⚠️ 踩坑记录: gz 包不要解压
  - 资源配置例
    - 固件: UEFI
    - CPU 类型: 硬件虚拟机化
    - CPU 核心: 1 核
    - 内存分配: 512MB
    - 磁盘类型: SATA
    - 网络类型: Intel E1000

## OpenWRT 初期配置

- 虚拟机开机
- VNC 终端开启,进入命令行配置
- 配置静态 IP
  - 编辑: `vi /etc/config/network`
  - 修改: `option ipaddr ***` → `option ipaddr '192.168.100.10'`
  - 修改: `option gateway ***` → `option ipaddr '192.168.100.1'`
  - 追加: `list dns '192.168.100.1'`
- 镜像源修改
  - 例如修改成南京大学镜像
  - 参考: [OpenWRT 软件仓库镜像使用帮助](https://help.mirror.nju.edu.cn/openwrt/?mirror=NJU)
  - 备份原有镜像配置: `cp /etc/opkg/distfeeds.conf /etc/opkg/distfeeds.conf.bak`
  - 执行命令: `sed -i 's_https\?://downloads.openwrt.org_https://mirror.nju.edu.cn/openwrt_' /etc/opkg/distfeeds.conf`
  - 更新: `opkg update`
- 安装中文
  - 执行命令: `opkg install luci-i18n-base-zh-cn`
- 安装主题
  - 参考: [Github luci-theme-argon](https://github.com/jerrykuku/luci-theme-argon#install-for-openwrt-official-snapshots-and-immortalwrt)
  - 下载 ipk 包: `luci-theme-argon_***.ipk`
  - 安装依赖: `opkg install luci-compat`, `opkg install luci-lib-ipkg`
  - 安装主题: `opkg install luci-theme-argon*.ipk`

## 关闭 OpenWrt 的 IPv4 DHCP（作为纯二级路由）

- 操作步骤
  - 登录 LuCI → 网络 → 接口
  - 找到 LAN → 点“修改”
  - 切换到 DHCP 服务器 这一页
  - 勾选：“忽略此接口”（Disable DHCP for this interface）
  - 保存并应用。
- 操作结果
  - LAN 口不再给终端发 IPv4 地址
  - 终端会从主路由拿 IP

## 关闭 IPv6 协议栈

- 操作步骤
  - 网络 → 接口 → LAN → 修改
  - 切到 DHCP 服务器 → IPv6 设置
  - 将三项全部设为“已禁用”：
    - RA 服务：已禁用
    - DHCPv6 服务：已禁用
    - NDP 代理：已禁用
  - 保存并应用。
  - 备注: 原文提及需要另外关闭`wan6`, 我这`OpenWRT`没有此接口,忽略
- 操作结果
  - `OpenWRT`内无 IPv6 地址,也不会 DHCP 发 IPv6 地址

## 用 dnsmasq-full 覆盖内置 dnsmasq

- 操作步骤
  - 执行: `opkg install dnsmasq-full --force-overwrite`
  - 必要时再加一层（一般用不到）: `opkg install dnsmasq-full --force-overwrite --force-depends`
  - 结果确认: `opkg list-installed | grep dnsmasq`
  - 看到 dnsmasq-full 存在即可
  - 重启服务: `/etc/init.d/dnsmasq restart`
- 操作结果
  - system 里的 DHCP/DNS 服务跑在 dnsmasq-full 上

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
