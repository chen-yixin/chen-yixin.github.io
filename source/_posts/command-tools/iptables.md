---
title: iptables
date: 2025-01-05 23:23:00
categories: 命令行工具
tags:
  - tools
sticky: 0
#cover:
comments: true
toc: true
---

使用`iptables`可以实现访问控制的功能。

<!-- more -->

## 环境准备

设备: Raspberry Pi 3B+
OS: Debian 10 (buster) aarch64

```bash
sudo apt install iptables
```

由于 debian 系默认不实用配置文件的方式持久化,因此补充安装以下包

```bash
sudo apt install iptables-persistent netfilter-persistent
```

## 生成/应用配置文件

```bash
netfilter-persistent save   # 保存规则到配置文件
netfilter-persistent start  # 从配置文件加载规则

iptables-save  > /etc/iptables/rules.v4
ip6tables-save > /etc/iptables/rules.v6

iptables-restore  < /etc/iptables/rules.v4
ip6tables-restore < /etc/iptables/rules.v6

# 查看防火墙+显示行号
iptables -nL --line-numbers
```

## 规则配置

```bash
# 放行一个ip地址
iptables -A INPUT -s 192.168.1.100 -p tcp -m tcp --dport 8080 -j ACCEPT

# 放行一个网段
iptables -A INPUT -s 192.168.2.0/24 -p tcp -m tcp --dport 8080 -j ACCEPT

# 放行多个端口
iptables -A INPUT -s 192.168.2.0/24 -p tcp -m multiport --dports 22,80:88 -j ACCEPT

# 拒绝一个端口(丢弃包,无返回)
iptables -A INPUT -p tcp -m tcp --dport 8080 -j DROP

# 拒绝一个端口(返回拒绝信息)
iptables -A INPUT -p tcp -m tcp --dport 8080 -j REJECT
```
