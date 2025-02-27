---
title: 使用SSH管理Windows
date: 2021-01-09 20:44:23
categories: 系统服务
tags:
  - tools
sticky: 0
cover: "http://img.hoboro.top/picgo/20210109190949.png"
comments: true
toc: true
---

网上有很多关于使用 win10-ssh 客户端登录 linux-ssh 服务端的介绍，但很少介绍多台 win10-ssh 服务端之间互访的。以下记录如何免密登录 win10-ssh 服务

<!-- more -->

- 根据微软文档描述,适用于 Windows 10 1809 或 Windows Server 2019 以上版本
- 以下内容如果无特别说明,在远程 Windows 主机上操作

# 安装 OpenSSH Server

## 图形界面

点开 **设置** -> **应用** -> **应用与功能** -> **可选功能**

![](//img.hoboro.top/picgo/20210109193605.png)

点击 **添加功能** 后跳出对话框,输入"ssh",勾选安装"OpenSSH 服务器"

![](//img.hoboro.top/picgo/20210109193825.png)

## PowerShell 方式

以下操作需要**管理员**权限

### 确认 OpenSSH 可用于安装

```powershell
Get-WindowsCapability -Online | ? Name -like 'OpenSSH*'
```

_输出以下内容_

```
Name  : OpenSSH.Client~~~~0.0.1.0
State : Installed

Name  : OpenSSH.Server~~~~0.0.1.0
State : NotPresent
```

### 安装 OpenSSH Server

```powershell
Add-WindowsCapability -Online -Name OpenSSH.Server~~~~0.0.1.0
```

_输出以下内容_

```
Path          :
Online        : True
RestartNeeded : False
```

# OpenSSH Server 服务配置

以下操作需要**管理员**权限

## 服务、防火墙相关

```powershell
# 开启服务
Start-Service sshd

# 设置自启动
Set-Service -Name sshd -StartupType 'Automatic'

# 查看状态
Get-Service sshd

#关闭服务
Stop-Service sshd

# 重启服务
Restart-Service sshd

# 确认防火墙是放开的
Get-NetFirewallRule -Name *ssh*
```

1. 确认`OpenSSH-Server-In-TCP`状态是 `enabled`
1. 至此可以在本地尝试`ssh username@ip`连接到远程机器

## 配置密钥免密登录

**↓ 本地执行**

```shell
# 生成密钥对
ssh-keygen -t rsa

# 找到公钥文件,复制内容备用
# Windows
# %HOMEPATH%\.ssh\id_rsa.pub
# Linux
# $HOME/.ssh/id_rsa.pu
```

**↑ 本地执行 | 远程执行 ↓**

1. 打开文件`%HOMEPATH%\.ssh\authorized_keys`
1. 把公钥文件添加到上述文件末尾
1. 修改文件`C:\ProgramData\ssh\sshd_config`,内容如下
1. 重启服务`Restart-Service sshd`

```
C:\ProgramData\ssh\sshd_config
确保以下3条没有被注释
PubkeyAuthentication yes
AuthorizedKeysFile    .ssh/authorized_keys

确保以下2条有注释掉
# Match Group administrators
#       AuthorizedKeysFile __PROGRAMDATA__/ssh/administrators_authorized_keys
```

## (可选)配置 PowerShell 作为 SSH 连接默认 SHELL

```powershell
# 管理员运行
New-ItemProperty -Path "HKLM:\SOFTWARE\OpenSSH" -Name DefaultShell -Value "C:\Windows\System32\WindowsPowerShell\v1.0\powershell.exe" -PropertyType String -Force
Restart-Service sshd
```

# 参考链接

[适用于 Windows 10 1809 和 Server 2019 的 OpenSSH 服务器配置](https://docs.microsoft.com/zh-cn/windows-server/administration/openssh/openssh_server_configuration)
