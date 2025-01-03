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

Git 的设置整理

<!-- more -->

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

Windows: 修改`%HOMEPATH%\.ssh\config`,不存在则新建(connect.exe已随git一同安装)

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


windows使用需要使用用户名密码的HTTP代理服务情况下

```
Host github.com
    User git
    ProxyCommand env CONNECT_USER=username CONNECT_PASSWORD=password connect.exe -H proxy.address:8080 %h %p
```
