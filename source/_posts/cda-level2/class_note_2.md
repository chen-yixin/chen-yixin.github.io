---
title: CDA Level-II 数据采集与处理
categories: CDA
top: false
comments: true
toc: true
date: 2025-04-08
tags:
  - 数据分析
  - 课程笔记
cover: //img.hoboro.top/picgo/202503262106764.jpg?imageView2/0/w/240/h/145
---

CDA > 课程笔记 > Chap2.数据采集与处理

<!-- more -->

来源: [CDA level 2 级课堂笔记](https://blog.csdn.net/m0_69037520/article/details/129732340)

## 数据采集方法

### 市场研究中的数据

- 按照尺度划分：名义、等级和连续
- 按照收集方式：实验数据和观测数据
- 按照描述对象与时间关系：时间序列数据、截面数据和面板数据

统计数据分为原始数据（调查或实验收集）和二手数据（其他私人、团队整理好的）。

**1.原始数据收集的方法**

- 观察法
- 实验法
- 调查法

**2.二手数据**

- 利用公开的二手资料
- 互联网爬取

可以节省时间、降低成本。

### 概率抽样方法

从总体中随机抽取一部分单位作为样本进行调查，并根据样本调查结果来推断总体特征的数据收集方法。

具有经济性、时效性强、适应面广、准确性高。

**1.四种抽样方法**

- 简单随机抽样（小样本使用较多）

  - 完全随机
  - 总体单位数很大时，难以实现，且抽样误差较大

- 分层抽样（重要的变量）（STR）
  也叫类型抽样，总体分成不同的层，每一层内进行抽样。

  - 等数/等比分配法（等数使用较多；等比法相较于简单随机抽样可以保证按照一定比例抽取）
  - 例如：企业大中小微类型分类

- 系统抽样（等距抽样）

  - 按照某一标志值的大小将总体单位进行排队并顺序编号

- 多段抽样

  - 大型抽样（经济调查）
  - 例如：北京市 → 区 → 街道 → 10000 人（从北京抽 10000 人组成样本单位）

**2.放回抽样（重复抽样）与不放回抽样**

某些建模会使用放回样本。

大数据时代使用不放回抽样（不会出现重复样本；例如三四百中抽取三四十）。

**3.抽样误差与非抽样误差**

抽样误差：用样本调查量推断总体参数的误差。随样本量增大而减少。

非抽样误差：不是抽样引起的。包括：登记性误差、测量误差、响应误差等；随样本量增大而增大。

**4.样本量的确定**

抽样量需要\>30 才算足够多。

**5.抽样在挖掘中的作用**

- 快速获取数据基本特征
- 数量大，建模速度较慢
- 数据不足时
- 数据平衡
- 数据分为训练集、测试集、验证集

### 非概率抽样方法

- 偶遇抽样
  方便、随意、任意

  - 探索性调查
  - 同质性强的总体
  - 时效性要求较高的调查
  - 流动性大的总体

  例如：对武汉市外来务工、经商人员的调查（在务工、经商人员集中的地方发放问卷）

- 判断抽样（典型、主观）

  - 选择具有代表性的群体作为样本
  - 找异常个案

- 定额抽样（配额抽样）
- 滚雪球抽样
- 空间抽样

优点：简单、成本低、统计上比概率抽样简单；有助于调研人员形成想法、拓展思路

缺点：不能估计抽样误差（统计上推断没法做）、难以评价样本所具有的代表性程度

### 概率抽样与非概率抽样的比较

- 概率抽样更为严格。
- 可以根据调查结果推断总体。
- 非概率抽样不依赖随机原则抽样样本，样本统计量的分布也是不确定的。

### 市场调研流程和目标设定

### 市场调研流程

针对潜在或当前的市场、目标用户、现有产品或计划中的产品系统化进行特定信息收集和数据分析的过程。

- 目标设定
  行业预研、目标分解、关键问题
- 调研前准备
  样本选取、问卷设计
- 调研
  座谈会、访谈、问卷填写
- 数据的处理和分析
  数据录入、统计、挖掘
- 拟写调查报告
  形成关键结论、建议

案例：HS 银行理财产品设计。

- 行业预研（背景了解；沉浸式研究）

  - 研究报告
  - 分析平台
  - 行业背景研究（个体发展趋势）
  - 地域维度对比（不同个体 ）

- 目标设定及关键问题

  - 客户定位分析
  - 市场竞争分析
  - 创新型理财产品设计

### 市场调研目标设定

### 市场调研前准备

方法：

- 焦点小组访谈（针对客户）
- 深度访问（专家）
- 实验产品、产品试销
- 定点拦访
- 中心定点访谈
- 网上问卷调查
- 电话问卷调查

样本选取、问卷设计

**1.案例说明–确定调研方式（理财产品）**

深度访问（专家访谈）+中心定点访问（抽样调查）

问卷设计–问题表述原则

- 具体性（不提抽象、笼统的问题）
- 单一性（一次只问一个问题）
- 通俗性（不是专业术语）
- 准确性（避免模棱两可）
- 客观性（不要有诱导性或倾向性）
- 非否定性（一般避免使用否定句形式）

问题的结构与问题类别。

推荐《社会调查方法》书籍。

### 调研实施

案例说明–专家访谈、座谈会（客户）、中心定点调研（客户抽样）

事先准备：专家访谈提纲、小组座谈会大纲、问卷

## 数据探查与可视化

SEMMA 方法论

建模前对数据进行探查（Explorer)：探查 y 是什么分布（不可补缺），x 可补缺

数据探查步骤（Explorer）：

- 探查数据问题

  - 缺失值
  - 连续变量离群值（可能为异常值或者错误值）
  - 分类变量稀疏水平（概化处理）
  - 时间序列的噪音值（降噪）

- 探查数据分布（不符合算法要求分布需要修改）

  - 为选定的算法进行分布调整
  - 根据变量分布选取合适算法

- 探查两变量间的关系（x 与 y）

  - 两连续（线性回归）
  - 两分类（卡方检验）
  - 分类与连续

### 单变量描述性统计

**1.变量类型**

分类变量

- 名义变量（无序）
- 等级变量（有排序）

连续变量

- 比例数据
- 间隔数据

**2.描述名义变量的分布**

频数表（频次、百分比） → 柱形图

**3.等级变量**

相比名义变量具备统计频次、累计百分比

**4.描述连续变量的分布–直方图**

集中趋势（位置）

离中趋势（分散程度）

偏态与峰态（形状）

**5.常见连续变量分布**

正态分布

泊松分布（常用于研究灯的寿命）

伽马分布（研究保险理财的理赔额度或者损失金额）

对数正态分布（取对数之后服从正态分布）

### 两变量描述性统计

**1.描述统计的总结**

单因子分类变量频数：频次、百分比

表分析分类变量（多变量）：频次、百分比

连续变量（盒须图、散点图）：中位数、均值、众数、分类汇总、汇总表

时序与两个连续变量：存量（柱形图）、流量、率（线图；右边为轴）

分类与单个连续变量（盒须图）：识别异常值（超过 3 倍）/离群值（超过上端）

### 制图原理

步骤：数据 → 信息 → 相对关系 → 图形

整理原始数据—确定表达的信息—确定比较的类型—确定图表类型

关系类型：

- 成分（不同个体占比）
- 排序
- 频率分布（单变量在不同数值上的数值或者百分比）
- 时间序列
- 关联性（公司销售额与国家宏观经济关系）

## 数据预处理基础

### 数据预处理基本步骤

- 单变量数据问题

  - 连续变量异常值（离群值、错误值）
    - [数据预处理基本步骤](#数据预处理基本步骤)
    - [错误数据识别与处理](#错误数据识别与处理)
    - [连续变量离群值识别与处理](#连续变量离群值识别与处理)
  - 分类变量含有稀有水平或错误值（[分类变量概化处理](#分类变量概化处理)）
  - 缺失值、单一值（[缺失值处理](#缺失值处理)）
  - 时间序列的噪音值（[噪声平滑](#噪声平滑（时序数据）)）

- 单变量数据分布

  - 对被解释连续变量的数据分布修改（[连续变量分布形态转换](#连续变量分布形态转换)）
  - 对输入连续变量的数据分布修改（[连续变量中心标准化或归一化](#连续变量中心标准化或归一化)）

- 两变量间的关系

  - 连续变量和解释变量之间高度线性关系（[变量降维](#变量降维)）
  - 连续型变量和连续型被解释变量非线性关系线性化（[连续变量分布形态转换](#连续变量分布形态转换)）
  - 连续型解释和二分类被解释变量 Logit 之间非线性关系线性化（[WoE](#WoE)）

### 错误数据识别与处理

生成 → 采集 → 转换 → 加工 → 报销（数据生命周期）

**利用图形可以直观快速对数据进行初步分析**

- 直方图、盒须图、散点图
  错误值处理办法

  - 修正

    - 补充正确信息
    - 对照其他信息源
    - 视为空值

  - 删除

    - 删除记录
    - 删除字段

### 连续变量离群值识别与处理

- 数值法判断（离群值）

  - 平均值法（中心标准化；对称分布）：平均值 ± 倍标准差之外的数据
    建议的临界值：

    - `|SR| > 2`，用于观察值较少的数据集
    - `|SR| > 3`，用于观察值较多的数据集

  - 四分位法（非对称分布）

    - `IQR = Q3 - Q1`
    - `Q1 - 1.5*IQR ~ Q3+1.5*IQR`

- 处理办法：可以直接剔除样本，也可以使用盖帽法、分箱法、WoE 法处理。
  盖帽法：大于三倍标准差的值找到，小于 1%（或者大于 99%）分位的数据替换为该位置的数值。

### 分类变量概化处理

- 利用图形可以发现分类变量中是否含有稀有水平或错误值（条形图、饼形图）

  - 识别出占比极少所在的观察个体，可能是稀有水平或错误值
  - 如果认为是稀有水平，则进行概化处理
  - 如果确认是错误值，则应该改正；确实无法改正的，作为缺失值处理

  **1.概化处理**

  - 简单合并
    将占比少的水平直接合并成一类。原则上要求合并后的占比大于 5%，样本量不低于 50 个。
  - 根据事实合并
    根据每个水平内被解释变量的 P 值、logit 值的大小排序进行合并。原则与上述一致。
  - 基于算法的合并
    分箱–有监督

    - 卡方分箱法
    - 决策树分箱

    分箱–无监督

    - 等距
    - 等频
    - 聚类

### 缺失值处理

类型和处理方式

- 完全随机缺失（单一插补法）
  数据的缺失与不完全变量以及完全变量都是无关的。
- 随机缺失（多重插补法；特点是不稳定，目前尽量避免使用）
  数据的缺失仅仅依赖于完全变量。
- 非随机、不可忽略缺失（例如收入高的低的都没有；利用模型进行截断数据处理）
  不完全变量中数据的缺失依赖于不完全变量本身，这种缺失是不可忽略的。

处理原则：

- 缺失值少于 20%

  - 连续变量使用均值或者中位数填补
  - 分类变量不需要填补，单算一类即可，或者使用众数填补

- 缺失值 20%~80%

  - 填补方法同上
  - 另外每个有缺失值的变量生成一个指示哑变量，参与后续的建模

- 缺失值大于 80%

  - 每个有缺失值的变量生成一个指示哑变量，参与后续的建模，原始变量不使用

做机器学习模型，需要填补后的变量以及缺失值指标变量（哑变量），模型来判断那个变量有用。做描述性统计不需要缺失值指示变量。

做填补时首先横向看记录，缺失过多直接删除。之后纵向看变量类型，可以对比其他数据源获取（例如性别），连续变量均值/中位数（例如年纪），可填‘未知’并增加指示变量（例如所在区域），分类建模、聚类均值（例如营销次数）。

### 噪声平滑（时序数据）

- 合理推断
  选取最合理的数值进行替换
- 简单移动平均
- 加权移动平均（权重一般取线性下降/指数下降趋势）

### 连续变量分布形态转换

- 百分位秩（理论上是均匀分布，不排除特殊情况）
  变量从小到大排序，然后依次赋予序号，最后用总的样本量除以序列号，值域`[0,100]`。
- Tukey 正态分布打分
  先转化为百分位秩，然后转化为正态分布
- 变量取自然对数
  `A = ln(x)`

三者对比：

非对称变量在聚类分析中选用**百分位秩和 Tukey 正态分布打分**比较多；

**在回归分析中取对数比较多**。因为商业上的聚类模型关心的客户的排序情况，回归模型关心的是其具有经济学意义，对数表达的是百分比的变化，

### 连续变量中心标准化或归一化

中心标准化：大部分会落到`[-3，3]`

{% mathjax %}
A = \frac{x_i - mean(x)}{std(x)}
{% endmathjax %}

极差标准化（归一化）：值域`[0,1]`

{% mathjax %}
A = \frac{x_i - min(x)}{max(x) - min(x)}
{% endmathjax %}

### 变量降维

变量降维（连续）：

- 主成分
- 因子分析
- 变量聚类（重要）

变量降维（分类）：概化处理

### WoE

（基于事实编码；信用卡评分广泛使用）
连续变量分箱（转化为分类变量）

- 分箱方法通过考察数据的“紧邻”来光滑数据的值。有序值分布到一些桶或者箱中。
- 等深分箱（百分位数划分）：每个分箱的样本值一致。
- 等宽分箱：每个分箱的取值范围一致。

| Bin   | Badcount | Goodcount | BadPecent | GoodPencent | WoE             |
| ----- | -------- | --------- | --------- | ----------- | --------------- |
| 1     | B1       | G1        | B1/B      | G1/G        | ln(G1/G / B1/B) |
| 2     | B2       | G2        | B2/B      | G2/G        | …               |
| Total | B        | G         |           |             |                 |

右侧 WoE 分子分母可以交换，这只会影响回归系数正负号。不过在一个项目中不可以交换。
