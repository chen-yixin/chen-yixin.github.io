---
title: 【草船借箭】2.数据预处理(PowerShell)
comments: true
toc: true
donate: true
share: true
categories: 数据分析
tags:
date: 2025-03-08
---

使用 PowerShell 脚本和正则表达式，预处理日志文件，输出 CSV 文件

<!-- more -->

## 背景

接上篇，搭建 SSH 蜜罐后，得到包含日期、IP、用户名、密码的 SSH 访问日志
如下：

```log
2025/03/07 12:20:36.496984 111.1.27.170:35638
2025/03/07 12:20:37.051431 111.1.27.170:35638 SSH-2.0-libssh2_1.11.0 pi pi
2025/03/07 12:20:37.165172 111.1.27.170:35638 SSH-2.0-libssh2_1.11.0 pi raspberry
2025/03/07 12:20:37.278851 111.1.27.170:35638 SSH-2.0-libssh2_1.11.0 pi 5nWt3P-fF4WosQm5O
2025/03/07 12:20:37.392358 111.1.27.170:35638 SSH-2.0-libssh2_1.11.0 pi FAqY7=MZk66k-ob3Rmk
```

使用 PowerShell 的方案，则无需依赖其他环境，直接可在 Windows 中执行

## 日志文件读取

获取 log 文件的路径。
fakessh 服务每启动一次则会新生成一个日志文件。
使用通配符批量读取文件。
例如日志文件已放在了`upstream`路径下。

```powershell
# 通过通配符，获得日志文件的路径
$inputFiles = Get-ChildItem -Path ".\upstream" -Filter "fakessh*.log"

# 遍历文件路径
foreach ($file in $inputFiles) {
  # 读取文件内容
  $lines = Get-Content -Path $file.FullName -Encoding UTF8
  ...
}
```

## 日志行解析逻辑

日志按行使用正则表达式解析，生成 Object。
使用在线工具，例如[嗨正则](https://hiregex.com/)，测出一个匹配的正则表达式。
正则表达式如下：`^([\d\/]+\s[\d:\.]+)\s([\d\.]+):(\d+)\s?(.*?)\s?(\S*)\s?(\S*)$`。

```powershell
# 初始化一个数组来存储结果
$results = @()

if ($line -match '^([\d\/]+\s[\d:\.]+)\s([\d\.]+):(\d+)\s?(.*?)\s?(\S*)\s?(\S*)$') {
  $results += [PSCustomObject]@{
    Datetime = $matches[1]
    IP = $matches[2]
    Port = $matches[3]
    Client = $matches[4]
    Username = $matches[5]
    Password = $matches[6]
  }
}
```

## 输出 CSV 文件

写入到指定路径`downstream`下的 CSV 文件中

```powershell
$outputCsv = ".\downstream\output_2.csv"

$results | Export-Csv -Path $outputCsv -NoTypeInformation -Encoding UTF8
```

## 尾巴

PowerShell 代码如下

```powershell
# 定义输入文件路径和输出CSV文件路径
$inputFiles = Get-ChildItem -Path ".\upstream" -Filter "fakessh*.log"
$outputCsv = ".\downstream\output_2.csv"

# 初始化一个数组来存储结果
$results = @()

# 遍历每个文件
foreach ($file in $inputFiles) {
    Write-Host "Processing: $file"

    # 读取文件内容
    $lines = Get-Content -Path $file.FullName -Encoding UTF8

    # 处理每一行
    foreach ($line in $lines) {
        # 使用正则表达式分割行，确保第4个字段可以包含空格
        if ($line -match '^([\d\/]+\s[\d:\.]+)\s([\d\.]+):(\d+)\s?(.*?)\s?(\S*)\s?(\S*)$') {
            $results += [PSCustomObject]@{
                Datetime = $matches[1]
                IP = $matches[2]
                Port = $matches[3]
                Client = $matches[4]
                Username = $matches[5]
                Password = $matches[6]
            }
        }
    }
}

# 将结果导出到CSV文件
$results | Export-Csv -Path $outputCsv -NoTypeInformation -Encoding UTF8

Write-Host "Complete, output:$outputCsv"
```

生成的 CSV 结果如下

```csv
"Datetime","IP","Port","Client","Username","Password"
"2025/03/07 12:20:36.496984","111.1.27.170","35638","","",""
"2025/03/07 12:20:37.051431","111.1.27.170","35638","SSH-2.0-libssh2_1.11.0","pi","pi"
"2025/03/07 12:20:37.165172","111.1.27.170","35638","SSH-2.0-libssh2_1.11.0","pi","raspberry"
"2025/03/07 12:20:37.278851","111.1.27.170","35638","SSH-2.0-libssh2_1.11.0","pi","5nWt3P-fF4WosQm5O"
"2025/03/07 12:20:37.392358","111.1.27.170","35638","SSH-2.0-libssh2_1.11.0","pi","FAqY7=MZk66k-ob3Rmk"
```

此方案基于 Windows 自带的 PowerShell 方案，但是运行速度比较慢，后续改用 Python 实现
