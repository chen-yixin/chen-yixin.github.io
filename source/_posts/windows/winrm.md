---
title: WinRM服务开启
date: 2020-08-08 23:38:05
categories: 系统服务
tags:
  - tools
sticky: 0
#cover:
comments: true
toc: true
---

WinRM远程命令行服务的开启,用于后续使用`pywinrm`执行远程命令使用

<!-- more -->

**重要**: 本文命令全部是管理员cmd窗口,如果不是cmd或不是管理员权限打开的,可能无法成功执行

## 准备工作

`WinRM`服务默认都是未启用的状态,先通过命令行查看状态;
如果没有返回或返回提示错误信息,则没有启动


```bat
winrm enumerate winrm/config/listener
```

## 开启WinRM服务

```bat
winrm quickconfig
;此处命令执行后可能出现修改防火墙规则的错误
;如果提示公用网络导致的,需要修改全部网络都不是公用(比如可以全部设置成专用网络)

;再次查看WinRM服务状态
winrm enumerate winrm/config/listener
```

## 为WinRM配置Auth

```bat
;basic方式登录验证
winrm set winrm/config/service/auth @{Basic="true"}

;配置加密方式为允许非加密
winrm set winrm/config/service @{AuthUnencrypted="true"}
```

## pywimrm登录验证

```python
>>> import winrm
>>> session = winrm.Session('<IP>', auth=('<username>', '<password>'))
>>> r = session.run_cmd('echo 1')
>>> r.std_out 
b'1\r\n'
```

## 尾巴

至此,适用pywinrm的WinRM服务已配置完毕
其他用途的,例如设备A通过PowerShell远程登录设备B,以上设置可能还不可用
对于需要适用加密方式的,需要在防火墙中,入站规则的5986端口开启
