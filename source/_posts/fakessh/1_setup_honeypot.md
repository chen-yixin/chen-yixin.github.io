---
title: 【草船借箭】1.搭建SSH蜜罐
comments: true
toc: true
donate: true
share: true
categories: 数据分析
tags:
date: 2025-03-07
---

基于 Docker 的方式搭建一个蜜罐 SSH 服务

<!-- more -->

## 背景

上网冲浪发现一篇文章，发现挺有趣的，拿来动手实践一下。

来源： [部署一个假 sshd，我也看看你的。](https://zhuanlan.zhihu.com/p/659197095)
蜜罐工程路径： [fffaraz/fakessh](https://github.com/fffaraz/fakessh)

## 修改真正的 SSH 服务

修改配置文件`/etc/ssh/sshd_config`

```conf
Port 22                    # 这里改成其他端口，云服务上防火墙上配置要放行此端口
PermitRootLogin no         # 把root登录的选项关闭
PasswordAuthentication no  # 密码认证关闭，只保留密钥认证
```

重启 SSH 服务`sudo systemctl restart sshd.service`

## 启动 SSH 蜜罐

拉取镜像`docker pull fffaraz/fakessh`

配置 docker-compose 文件

```yaml
version: "3"

services:
  fakessh:
    container_name: fakessh
    image: fffaraz/fakessh
    restart: always
    ports:
      - 22:22
    command: /log
    volumes:
      - /home/docker/fakessh/log:/log
    environment:
      - TZ=Asia/Shanghai
```

## 查看生成的 log

根据 docker-compose 配置的宿主机路径，例如`/home/docker/fakessh/log/fakessh-***.log`，查看生成的 log

```log
2025/03/07 12:20:36.496984 111.1.27.170:35638
2025/03/07 12:20:37.051431 111.1.27.170:35638 SSH-2.0-libssh2_1.11.0 pi pi
2025/03/07 12:20:37.165172 111.1.27.170:35638 SSH-2.0-libssh2_1.11.0 pi raspberry
2025/03/07 12:20:37.278851 111.1.27.170:35638 SSH-2.0-libssh2_1.11.0 pi 5nWt3P-fF4WosQm5O
2025/03/07 12:20:37.392358 111.1.27.170:35638 SSH-2.0-libssh2_1.11.0 pi FAqY7=MZk66k-ob3Rmk
```

由此，来源 IP、客户端版本、用户名、密码已经记录下来了。
积累一段时间日志，以备汇总为密码字典。
