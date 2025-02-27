---
title: 网络工程师-计算机硬件基础
categories: 软考
top: false
comments: true
toc: true
date: 2021-03-20 18:13:41
tags:
cover: //img.hoboro.top/picgo/20210320181828.png?imageView2/0/w/240/h/145
---

软考中级 > 网络工程师 > 1.计算机硬件基础

<!-- more -->

[来源](https://www.bilibili.com/video/BV18Z4y1A7Yk)

## 数据的表示

- 2 进制、8 进制、16 进制
- 原码、反码、补码
- 逻辑运算(或, 与, 非, 异或)

## 计算机的组成与系统结构

### 计算机结构

- 冯·诺依曼结构
  - 运算器
    - 算数计算单元 ALU
    - **累加寄存器 AC** (暂存中间结果)
    - 数据缓冲寄存器
    - 状态条件寄存器
  - 控制器
    - **程序计数器 PC** (保存指令地址)
    - 指令寄存器 IR
    - 指令译码器
    - 时序部件
  - 存储器
  - 输入
  - 输出
- 总线
  - 数据总线
  - 地址总线
  - 控制总线

![](//img.hoboro.top/picgo/20210320171816.png)

### 寻址方式

- 指令
  - 操作码
  - 地址码 (操作数的地址)
- 立即寻址
- 内存寻址
  - 直接寻址
  - 间接寻址
  - 变址寻址
- 寄存器寻址
  - 寄存器寻址
  - 寄存器间接寻址

![](//img.hoboro.top/picgo/20210320171857.png)

### 指令集

- CISC(复杂指令集)
  - 指令数量多,使用频率差别大
  - 偏向用户编程灵活性
- RISC(精简指令集)
  - 指令数量少,使用频率接近
  - 偏向机器高效性

### 流水线

![](//img.hoboro.top/picgo/20210320173758.png)

- 指令执行流程: 取值 -> 分析 -> 执行
- 多条指令执行方式
  - 顺序方式
  - 流水线方式
- 性能参数
  - 流水线执行时间 {% mathjax %}T_k = (t_1+t_2+t_3)+(n-1)max(t_1,t_2,t_3){% endmathjax %}
    - {% mathjax %}t_1{% endmathjax %} 取值耗时
    - {% mathjax %}t_2{% endmathjax %} 分析耗时
    - {% mathjax %}t_3{% endmathjax %} 执行耗时
  - 吞吐率 {% mathjax %}T_p = n / T_k{% endmathjax %}
    - {% mathjax %}n{% endmathjax %} 指令条数
    - {% mathjax %}T_k{% endmathjax %} 流水线时间
  - 加速比 {% mathjax %}S = T_s / T_k{% endmathjax %}
    - {% mathjax %}T_k{% endmathjax %} 顺序时间
    - {% mathjax %}T_s{% endmathjax %} 流水线时间

## 存储系统

### 存储系统架构

- CPU - 寄存器
- 缓存 Cache
- 主存 - 内存
  - RAM 掉电丢失
  - ROM 掉电不丢失
- 辅存 - 硬盘...

![](//img.hoboro.top/picgo/20210320174627.png)

### 存储器的存取方式

- 顺序存取 - 磁带
- 直接存取 - 硬盘
- 随机存取 - 内存
- 相联存取 - cache(内容,不是地址)

### 主存储器基础 - 组成

一片或多片存储芯片配以存储芯片组成

### cache

- 作用: 弥补寄存器与内存的速度差
- 平均访问周期 {% mathjax %}t_3 = ht_1 + (1-h)t_2{% endmathjax %}
  - {% mathjax %}h{% endmathjax %} cache 命中率
  - {% mathjax %}t_1{% endmathjax %} cache 访问周期
  - {% mathjax %}t_2{% endmathjax %} 内存访问周期
- 淘汰算法
  - 先进先出
  - 最近最少使用
  - 随机算法

### 硬盘

- IDE (PATA) 数据线、控制线复用
- SATA 串行 ATA
- SCSI 占用 CPU 较低,小型服务器使用
- NLSAS 介于 SATA 与 SAS 之间
- SAS 串行 SCSI,兼容 SATA,中高端用户
- FC 光纤通道 高端用户,数据中心

### RAID 独立磁盘冗余

- RAID 技术
  - 条带化、检验、镜像
  - 条带宽度 \* 条带大小 = 条带深度
    - 条带宽度 多少个物理磁盘
    - 条带大小 单块物理磁盘中的分区大小
- 基本 RAID
  - RAID0
    - 条带化、数据分段
    - 利用率 100%
    - 可靠性最差
    - 硬盘最少 2 个
  - RAID1
    - 磁盘镜像
    - 利用率 50%
    - 可靠性好
    - 硬盘数量 2N 个,最少 2 个
  - RAID3
    - 奇偶校验+条带化
    - 利用率 {% mathjax %}\frac{n-1}{n}{% endmathjax %}
    - 可靠性较好
    - 有奇偶 I/O 瓶颈
    - 硬盘数量最少 3 个
  - RAID5
    - 奇偶校验+条带化
    - 利用率 {% mathjax %}\frac{n-1}{n}{% endmathjax %}
    - 可靠性较好
    - RAID3 基础上,校验条带分布在不同的物理磁盘上
    - 硬盘数量最少 3 个
  - RAID6
    - 有 2 个奇偶校验位
    - 利用率 {% mathjax %}\frac{n-2}{n}{% endmathjax %}
    - 允许同时挂 2 块硬盘
- 组合 RAID
  - RAID10
    - 先 RAID1 镜像,后 RAID0 条带化
    - 利用率 50%
    - 硬盘数量 2N 个,最少 4 个
- RAID 数据保护
  - 热备盘
  - 预拷贝
  - 失效重构
  - RAID 状态
- 发展
  - 传统 RAID
  - LUN 虚拟化
  - 块虚拟化(RAID2.0)
    - 快速重构
    - 自动负载均衡
    - 系统性能提升
    - 自愈合

![](//img.hoboro.top/picgo/20210320181134.png)

## 可靠性

![](//img.hoboro.top/picgo/20210320181228.png)
