---
title: 文件Hash计算
date: 2025-01-03 16:02:01
categories: 命令行工具
tags:
  - tools
sticky: 0
#cover:
comments: true
toc: true
---

下载一个文件之后检查文件是否正确,使用 hash 数值确认是否一致,基于系统自带的命令可以无需下载第三方工具完成 hash 计算

<!-- more -->

## Windows

- 支持以下 Hash 算法: `MD2`,`MD4`,`MD5`,`SHA1`,`SHA256`,`SHA384`,`SHA512`

```powershell
# MD5
certutil -hashfile <文件路径> MD5

# SHA1
certutil -hashfile <文件路径> SHA1
```

## Linux

```sh
# MD5
md5sum <文件路径>

# SHA1
sha1sum <文件路径>
```

## macOS

```sh
# MD5
md5 <文件路径>

# SHA1
shasum <文件路径>
```
