---
title: Hello World!
date: 2020-10-24 00:00:00
categories: Hexo
tags:
  - hexo
sticky: 1
#cover:
comments: true
toc: true
---

欢迎使用 `Kratos : Rebirth` 这个我们精心打造的 Hexo 主题！希望能在接下来的旅途中与您相伴，共同创造出更多难以忘怀的美好体验。

<!-- more -->

如果直接使用`hexo new <title>`的方式新建文章，会在`source/_posts`新建文章，使用`hexo generate`编译 markdown 文件时，输出到`public`目录下，之后`hexo deploy`则将未完成的文章一并部署到服务器。使用`draft`机制规避以上问题

## 建立文章草稿

```bash
hexo new draft <title>
```

## 本机预览草稿

```bash
hexo server --draft  # hexo s --draft
```

## 草稿转为正式文章

```bash
hexo publish <title>  # hexo p <title>
```

## 静态文件生成&发布

```bash
# 静态文件生成
hexo generate  # hexo g

# 部署静态文件到服务器
hexo deploy  # hexo d

# 静态文件+部署一步
hexo g -d  # hexo d -g
```
