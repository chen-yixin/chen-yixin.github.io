---
title: 【草船借箭】4.密码统计分析(Pandas)
comments: true
toc: true
donate: true
share: true
categories: 数据分析
tags:
date: 2025-03-12
---

使用 Pandas 的方案，分析统计用户名密码概况

<!-- more -->

## 背景

接上篇，已生成了数据处理过的 CSV 文件，包含时间、IP、用户名、密码信息。
如下：

```csv
timestamp,ip,port,client,username,password
2025/03/07 12:20:36.496984,111.1.27.170,35638,,,
2025/03/07 12:20:37.051431,111.1.27.170,35638,SSH-2.0-libssh2_1.11.0,pi,pi
2025/03/07 12:20:37.165172,111.1.27.170,35638,SSH-2.0-libssh2_1.11.0,pi,raspberry
2025/03/07 12:20:37.278851,111.1.27.170,35638,SSH-2.0-libssh2_1.11.0,pi,5nWt3P-fF4WosQm5O
2025/03/07 12:20:37.392358,111.1.27.170,35638,SSH-2.0-libssh2_1.11.0,pi,FAqY7=MZk66k-ob3Rmk
```

本次使用累积一年多的日志分析。

## CSV 文件加载

使用`Pandas`加载 csv 作为`DataFrame`

```python
import pandas as pd
from common import DOWNSTREAM_DIR

df = pd.read_csv(DOWNSTREAM_DIR / 'output_3.csv')
```

## 最常用用户名 TOP10

把用户名字段提取出来后，进行统计计数，去掉计数小于 5 次的结果
`Pandas`代码实现如下：

```python
usernames = df['username'].value_counts()
usernames = usernames[usernames >= 5]
```

统计结果前 10 如下

| username | count |
| -------- | ----- |
| root     | 50969 |
| ubuntu   | 821   |
| admin    | 735   |
| user     | 634   |
| aaa      | 502   |
| lab      | 502   |
| test     | 398   |
| debian   | 299   |
| oracle   | 173   |
| ftpuser  | 170   |

最常用的用户名`root`断崖式领先

## 最常用密码 TOP10

类似的，对密码字段分析
`Pandas`代码实现如下：

```python
passwords = df['password'].value_counts()
passwords = passwords[passwords >= 5]
```

| password | count |
| -------- | ----- |
| 123456   | 2752  |
| 123      | 527   |
| 1234     | 233   |
| password | 228   |
| 12345678 | 223   |
| admin    | 176   |
| root     | 162   |
| 12345    | 161   |
| test     | 139   |
| 1        | 137   |

前 10 密码还都是很常见的弱密码

## 用户名密码组合 TOP10

再看看用户名密码的组合最常见的

```python
df_auth = (
    df
    .groupby(['username', 'password'])
    .size()
    .reset_index(name='count')
    .sort_values('count', ascending=False)
)
```

| username | password | count |
| -------- | -------- | ----- |
| root     | 123456   | 165   |
| root     | root     | 51    |
| ubuntu   | 123456   | 45    |
| test     | test     | 41    |
| admin    | admin    | 38    |
| test     | 12345678 | 37    |
| root     | password | 36    |
| root     | Aa123456 | 33    |
| root     | 1234     | 31    |
| ubuntu   | ubuntu   | 30    |

## SSH 客户端 TOP10

```python
clients = df['client'].value_counts()
clients = clients[clients >= 5]
```

| client                 | count |
| ---------------------- | ----- |
| SSH-2.0-Go             | 45649 |
| SSH-2.0-libssh_0.9.6   | 16566 |
| SSH-2.0-libssh2_1.11.0 | 1400  |
| SSH-2.0-libssh_0.7.4   | 1000  |
| SSH-2.0-libssh2_1.7.0  | 293   |
| SSH-2.0-libssh2_1.9.0  | 276   |
| SSH-2.0-makiko         | 257   |
| SSH-2.0-libssh2_1.4.3  | 219   |
| SSH-2.0-libssh_0.10.5  | 149   |
| SSH-2.0-libssh2_1.10.0 | 108   |

## 访问 IP TOP10

```python
ips = df['ip'].value_counts()
ips = ips[ips >= 5]
```

| client          | count |
| --------------- | ----- |
| 218.0.55.157    | 46203 |
| 186.53.130.195  | 24077 |
| 116.128.230.184 | 7167  |
| 62.25.85.233    | 5495  |
| 177.234.178.105 | 5390  |
| 54.249.4.26     | 4626  |
| 110.52.193.178  | 4441  |
| 47.76.79.138    | 4214  |
| 47.95.208.72    | 4194  |
| 60.205.91.164   | 4151  |

## 排序结果输出到文本文件中

```python
from common import OUTPUT_DIR

fields = ['usernames', 'passwords', 'clients', 'ips']
for field in fields:
    with open(OUTPUT_DIR / f'{field}.txt', 'w', encoding='utf-8') as file:
        for value in eval(f'{field}.index'):
            file.write(f"{value}\n")
```

上述 4 个文件已上传`GitHub`

- [usernames.txt](https://github.com/chen-yixin/straw_boats_borrow_arrows/blob/main/output/usernames.txt)
- [passwords.txt](https://github.com/chen-yixin/straw_boats_borrow_arrows/blob/main/output/passwords.txt)
- [clients.txt](https://github.com/chen-yixin/straw_boats_borrow_arrows/blob/main/output/clients.txt)
- [ips.txt](https://github.com/chen-yixin/straw_boats_borrow_arrows/blob/main/output/ips.txt)
