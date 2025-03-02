---
title: RDP连接保存用户名和密码
date: 2021-11-07 17:33:14
categories: 教程文档
tags:
  - tools
sticky: 0
comments: true
toc: true
---

Windows 自带远程桌面每次登录需要输入账号密码，比较麻烦。当然也可以第一次登录时直接保存密码，但这种方法是保存到本地电脑上

<!-- more -->

## 保存 RDP 文件

输入 IP 和用户名后,点击下方的"保存",将 RDP 文件保存至指定位置。
![RDP对话框](//img.hoboro.top/picgo/202111071728455.png)

## 生成密码

打开 powershell,执行以下命令,复制输出的密码备用。

```powershell
("password" | ConvertTo-SecureString -AsPlainText -Force) | ConvertFrom-SecureString;
```

## 修改 RDP 文件

用文本编辑器将 RDP 文件打开,加入以下 2 行。

```
username:s:登录账号
password 51:b:加密后的密码
```
