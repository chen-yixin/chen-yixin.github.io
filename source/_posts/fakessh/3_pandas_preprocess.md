---
title: 【草船借箭】3.数据预处理(Pandas)
comments: true
toc: true
donate: true
share: true
categories: 数据分析
tags:
date: 2025-03-09
---

使用 Pandas 的方案，预处理日志文件，输出 CSV 文件

<!-- more -->

## 背景

和上篇使用的上游数据相同，日期、IP、用户名、密码的 SSH 访问日志
如下：

```log
2025/03/07 12:20:36.496984 111.1.27.170:35638
2025/03/07 12:20:37.051431 111.1.27.170:35638 SSH-2.0-libssh2_1.11.0 pi pi
2025/03/07 12:20:37.165172 111.1.27.170:35638 SSH-2.0-libssh2_1.11.0 pi raspberry
2025/03/07 12:20:37.278851 111.1.27.170:35638 SSH-2.0-libssh2_1.11.0 pi 5nWt3P-fF4WosQm5O
2025/03/07 12:20:37.392358 111.1.27.170:35638 SSH-2.0-libssh2_1.11.0 pi FAqY7=MZk66k-ob3Rmk
```

## 日志文件读取

获取 log 文件的路径。
fakessh 服务每启动一次则会新生成一个日志文件。
使用通配符批量读取文件。
例如日志文件已放在了`upstream`路径下。

```python
# 取得全部上游数据的文件路径
from typing import List
from pathlib import Path
from common import UPSTREAM_DIR

upstream_files: List[Path] = []
for filepath in UPSTREAM_DIR.glob('*.log'):
    upstream_files.append(filepath)
```

## 日志行解析逻辑

日志按行使用正则表达式解析，生成 Object。
使用在线工具，例如[嗨正则](https://hiregex.com/)测出一个匹配的正则表达式。
正则表达式如下：`^([\d\/]+\s[\d:\.]+)\s([\d\.]+):(\d+)\s?(.*?)\s?(\S*)\s?(\S*)$`。

```python
# 初始化一个数组来存储结果
# 解析上游数据
import re
pattern = re.compile(r'^([\d/]+\s[\d:.]+)\s([\d.]+):(\d+)\s?(.*?)\s?(\S*)\s?(\S*)$')

records = []
for upstream_file in upstream_files:
    with open(upstream_file, 'r', encoding='utf-8') as f:
        for line in f.readlines():
            if match := pattern.match(line):
                record = {
                    'timestamp': match.group(1),
                    'ip': match.group(2),
                    'port': match.group(3),
                    'client': match.group(4),
                    'username': match.group(5),
                    'password': match.group(6),
                }
                records.append(record)
```

## 输出 CSV 文件

写入到指定路径`downstream`下的 CSV 文件中

```python
# CSV文件输出
import csv
from common import DOWNSTREAM_DIR

fieldnames = ['timestamp', 'ip', 'port', 'client', 'username', 'password']
csv_path = DOWNSTREAM_DIR / "output_3.csv"

with open(csv_path, 'w', newline='', encoding='utf-8') as csvfile:
    writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
    writer.writeheader()
    for record in records:
        writer.writerow(record)
```

## 尾巴

生成的 CSV 结果如下

```csv
timestamp,ip,port,client,username,password
2025/03/07 12:20:36.496984,111.1.27.170,35638,,,
2025/03/07 12:20:37.051431,111.1.27.170,35638,SSH-2.0-libssh2_1.11.0,pi,pi
2025/03/07 12:20:37.165172,111.1.27.170,35638,SSH-2.0-libssh2_1.11.0,pi,raspberry
2025/03/07 12:20:37.278851,111.1.27.170,35638,SSH-2.0-libssh2_1.11.0,pi,5nWt3P-fF4WosQm5O
2025/03/07 12:20:37.392358,111.1.27.170,35638,SSH-2.0-libssh2_1.11.0,pi,FAqY7=MZk66k-ob3Rmk
```

此方案比较前文 PowerShell 的运行速度有较大提升
