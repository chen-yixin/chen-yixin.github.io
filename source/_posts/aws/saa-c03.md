---
title: AWS SAA-C03 备考知识点整理
date: 2026-06-18 12:00:00
categories: AWS
tags:
  - SAA-C03
  - AWS
  - 认证
  - 备考
comments: true
toc: true
donate: true
share: true
---

> 基于完整题库（1150题）系统分析 · 2026年版

<!-- more -->



## 网络与连接

### VPC 端点（Endpoint）

| 类型 | 支持服务 | 费用 | 路由方式 |
|------|----------|------|----------|
| **网关端点（Gateway）** | **仅** S3、DynamoDB | **免费** | 路由表条目 |
| **接口端点（Interface/PrivateLink）** | 大多数 AWS 服务（SSM、KMS 等） | 收费（ENI） | 私有 IP |

**核心考点：**
- EC2 访问 S3/DynamoDB 不走互联网 → **S3/DynamoDB 网关端点**（免费）
- EC2 访问 Systems Manager（无互联网）→ **接口 VPC 端点**
- 减少 NAT 网关流量费用 → **网关端点替代 NAT**
- S3 网关端点不支持安全组，用**端点策略**限制访问
- 安全访问 S3：**VPC 网关端点 + S3 存储桶策略**（双重限制）

❌ 陷阱：接口端点比网关端点**贵**；S3 和 DynamoDB 用网关端点，不是接口端点（除非需要 PrivateLink/跨 VPC 对等访问）

### 混合连接

| 方案 | 特点 | 适用场景 |
|------|------|----------|
| AWS Direct Connect | 专线，低延迟稳定，建设周期长 | 高带宽，延迟敏感 |
| Site-to-Site VPN | 公网加密隧道，快速部署 | 备用/低成本 |
| Client VPN | 个人远程访问 VPC | 员工远程办公 |

**高可用混合架构（高频考点）：**
- 主连接：**Direct Connect**（低延迟）
- 备用：**Site-to-Site VPN**（成本低，容忍速度下降）
- ❌ 不推荐两条 DX 作主备（成本高）

**Direct Connect 高弹性：**
- 两个不同位置的 DX 连接 = 高弹性
- 单个 DX + VPN 备份 = 成本效益最优

### Transit Gateway

- 连接**多个 VPC + 本地数据中心**的枢纽（Hub-and-Spoke）
- 解决 VPC Peering 数量增多难以管理的问题
- 架构：本地数据中心 → Direct Connect → **Transit Gateway** ← 各 VPC
- 场景：多 VPC 互通 + 单条 DX 连本地 → **Transit Gateway**

### VPC Peering（对等连接）

- 两个 VPC 之间的私有连接
- 不支持传递路由（A-B-C 不能通过 B 连通 A 与 C）
- 适合少量 VPC；大量 VPC 用 Transit Gateway

### NAT 网关 vs NAT 实例

| 对比 | NAT 网关 | NAT 实例 |
|------|---------|---------|
| 管理 | AWS 全托管 | 自管 EC2 |
| 高可用 | 每个 AZ 独立部署 | 手动配置 |
| 性能 | 自动扩展 | 取决于实例规格 |
| 推荐 | ✅ 优先使用 | 过时方案 |

**高可用 NAT 架构：** 每个 AZ 的**公有子网**部署一个 NAT 网关，私有子网路由表指向**同 AZ 的 NAT 网关**

### 安全组 vs 网络 ACL

| 对比 | 安全组 | 网络 ACL |
|------|--------|---------|
| 作用层 | 实例级别 | 子网级别 |
| 规则类型 | 仅允许规则 | 允许 + 拒绝规则 |
| 状态 | 有状态 | 无状态 |
| 阻止 IP | ❌ 不支持 | ✅ 支持 |

**典型安全组配置：**
- Web 层：允许 `0.0.0.0/0 : 443`（HTTPS 入站）
- DB 层（MySQL）：允许 **Web层安全组 ID : 3306**（最小权限）
- DB 层（SQL Server）：允许 **Web层安全组 ID : 1433**

**堡垒主机（Bastion Host）：**
- 堡垒主机安全组：仅允许**公司外部 IP 段** SSH 入站
- 应用实例安全组：仅允许**堡垒主机私有 IP 或安全组** SSH 入站

### AWS PrivateLink

- 为 SaaS 服务提供**私有连接**（不经过公共互联网）
- 服务提供方：NLB 后端 + 创建 VPC 端点服务
- 服务使用方：创建**接口 VPC 端点**访问

### IPv6 与子网

- AWS VPC 总是同时启用 IPv4（双栈），无纯 IPv6 VPC
- 子网 CIDR 耗尽 → 添加辅助 IPv4 CIDR 块（不是改为 IPv6）

---

## 负载均衡

### 三种负载均衡器对比

| 类型 | 工作层 | 协议 | 关键特性 |
|------|--------|------|----------|
| **ALB（应用）** | 第 7 层 | HTTP/HTTPS/WebSocket | 基于内容路由、主机头、查询字符串路由、HTTP 健康检查 |
| **NLB（网络）** | 第 4 层 | **TCP/UDP/TLS** | **静态 IP**、极低延迟、适合游戏/IoT |
| **CLB（经典）** | 4/7 层 | TCP/HTTP | 旧版，不推荐 |

### 关键选择逻辑

- **UDP 协议** → **NLB**
- **需要静态 IP** → **NLB** 或 **Global Accelerator**
- **HTTP 应用健康检查（检测 HTTP 错误）** → **ALB**（NLB 只做 TCP 层检查）
- **HTTP → HTTPS 重定向** → **ALB 监听器规则**
- **SSL 终止（卸载 EC2 的 SSL 压力）** → 将证书导入 ACM → 配置 **ALB HTTPS 监听器**
- **基于查询字符串/主机头路由** → **ALB 高级路由规则**

❌ 陷阱：
- NLB **不能**检测 HTTP 应用层错误，HTTP 健康检查需要 ALB
- ❌ 网络 ACL 不能做 HTTP→HTTPS 重定向

### SSL/TLS 证书

- **第三方 CA 证书** → 导入 **ACM** → 应用到 ALB → 通过 **EventBridge + SNS** 通知即将到期 → **手动轮换**
- **ACM 颁发证书** → 支持**自动续期**
- 证书到期通知 → **AWS Config 规则**（`acm-certificate-expiration-check`）+ SNS

### 粘性会话（Sticky Session）

- ALB 支持粘性会话（将同一用户请求路由到同一后端）
- 电商交易中保持会话一致性 → **ALB 粘性会话 + ElastiCache 持久化会话**

---

## 计算服务

### EC2 实例系列

| 系列 | 特点 | 场景 |
|------|------|------|
| **M** | 通用均衡 | 一般应用 |
| **C** | 计算优化 | CPU 密集（机器学习推理、视频编码） |
| **R** | 内存优化 | 内存密集型（大型内存数据库、实时分析） |
| **T** | 可突发 | 开发/测试，低基准负载 |
| **I/D** | 存储优化 | 高 IOPS（NVMe SSD 实例存储，亚毫秒延迟） |
| **P/G** | GPU | ML 训练 |

- **内存密集任务性能问题** → 换用 **R 系列**实例
- **临时文件最快存储（亚毫秒）** → **EC2 实例存储（NVMe）**（非持久化）
- **HPC 亚毫秒延迟批量处理** → 实例存储（I 系列）

### EC2 置放群组

| 类型 | 特点 | 适用 |
|------|------|------|
| **集群（Cluster）** | **同一 AZ** 内，低延迟高吞吐 | HPC、紧耦合节点通信 |
| **分区（Partition）** | 跨多分区隔离故障域 | Hadoop、Cassandra、Kafka |
| **分散（Spread）** | 每实例独立物理硬件 | 少量关键实例高可用 |

> **HPC 低延迟节点通信** → **集群置放群组**

### Lambda 核心限制（高频考点！）

- **最大运行超时：15 分钟**
- 超过 15 分钟的任务 ❌ 不能用 Lambda → 用 **EC2 Spot** 或 **AWS Batch** 或 **Fargate**
- Lambda 默认**不在 VPC 中**，若需要访问 VPC 内资源需配置 VPC
- Lambda 并发大量连接数据库 → 用 **RDS Proxy**
- **CloudWatch 不采集 Lambda 内存指标**（但 Lambda 有内置内存配置监控）
- Lambda 最大内存：**10 GB**（适合 ML 模型加载）
- 冷启动问题 → **Provisioned Concurrency（预置并发）**

### Auto Scaling

**扩展策略类型：**
- **目标跟踪**：保持指标在目标值（如 CPU 40%）
- **步进扩展**：按阈值级别扩展
- **预定扩展**：按计划时间扩展（已知高峰如批处理作业）
- **预测扩展**：基于 ML 预测流量模式（周期性流量）

**生命周期钩子（Lifecycle Hooks）：**
- 实例启动/终止前执行自定义操作
- 场景：实例启动后向审计系统发送报告

### EC2 容量预留

- **按需容量预留（On-Demand Capacity Reservation）**：在特定 AZ 预留容量，无需长期承诺
- 适合：特定活动保证 EC2 容量（1 周活动）→ **容量预留**（非预留实例）

### EBS 卷类型

| 类型 | 最大 IOPS | 特点 |
|------|-----------|------|
| **gp3** | 16,000 | 通用 SSD，可独立配置 IOPS，**性价比最高** |
| **gp2** | 16,000 | 通用 SSD，IOPS 随容量变化 |
| **io2/io1** | 64,000+ | 预置 IOPS SSD，关键数据库 |
| **st1** | 500 MiB/s | 吞吐优化 HDD，顺序读写 |
| **sc1** | 250 MiB/s | 冷 HDD，低成本归档 |

- 可配置且独立于容量的 IOPS → **gp3 或 io1/io2**
- 需要跨多个 EC2 共享块设备 → **EBS Multi-Attach**（仅 io1/io2，同 AZ）
- EBS 加密默认：**账户级别开启默认加密** → 所有新建卷自动加密

---

## 存储服务

### S3 存储类对比

| 存储类 | 可用性 | 最低存储期 | 检索延迟 | 适用 |
|--------|--------|-----------|---------|------|
| **Standard** | 99.99% | 无 | 毫秒 | 频繁访问 |
| **Standard-IA** | 99.9% | 30 天 | 毫秒 | 不频繁但需立即检索 |
| **One Zone-IA** | 99.5% | 30 天 | 毫秒 | 不频繁，单 AZ，可重建 |
| **Intelligent-Tiering** | 99.9% | 无 | 毫秒 | **未知/不规则访问模式** |
| **Glacier Instant** | 99.9% | 90 天 | 毫秒 | 归档，需即时检索 |
| **Glacier Flexible** | 99.9% | 90 天 | 分钟～小时 | 归档 |
| **Glacier Deep Archive** | 99.9% | 180 天 | 12 小时 | 最低成本长期归档 |

**常见生命周期场景：**
- 前 30 天频繁访问，之后不频繁但须**立即检索**，保留 4 年 → **Standard → Standard-IA**（30天后）
- 2 年内高可用，之后归档 25 年 → **Standard → Glacier Deep Archive**（2年后）
- 访问模式未知，文件 ≥ 128 KB → **S3 Intelligent-Tiering**
- 日志保留 10 年，1 个月后不常访问 → **S3 + 生命周期 → Glacier Deep Archive**（30天后）
- 每月初访问，不规则 → **Aurora Serverless** 或 **DynamoDB On-Demand**（数据库场景）

### S3 数据保护

**S3 Object Lock（对象锁）**
- 必须先启用**版本控制**
- **合规模式（Compliance）**：任何用户（包括 root）在保留期内不可删除/修改 → 法规要求
- **治理模式（Governance）**：有特定权限的用户可覆盖保留期
- **合法保留（Legal Hold）**：无固定保留期，直到明确移除

| 保护场景 | 推荐方案 |
|---------|---------|
| 不可修改/删除（法规） | S3 Object Lock + 版本控制 |
| 防意外删除 | 版本控制 + MFA Delete |
| 特定用户可删除 | Object Lock 合法保留（Legal Hold） |
| 任何人不可删除包括 root | **合规模式** |

**S3 Requester Pays：**
- 数据请求方承担流量费用 → 共享大型数据集

**S3 预签名 URL：**
- 为无 AWS 凭证的用户提供**临时、有限时间**的访问
- 适合向外部合作方提供 S3 文件下载

**S3 Object Lambda：**
- 在数据返回请求应用之前，用 Lambda 修改数据（如屏蔽 PII）
- 无需维护多个数据副本

### S3 Transfer Acceleration

- 利用 CloudFront 边缘节点加速**全球上传**到 S3
- 每个站点有高速网络 + 全球数据汇聚 → **S3 Transfer Acceleration**

### CloudFront + S3 访问控制

- 仅通过 CloudFront 访问 S3（禁止直接 S3 URL）→ **OAI（源访问身份）** 或 **OAC（源访问控制）**
- CloudFront 字段级加密（Field-Level Encryption）：保护特定敏感字段在整个处理链中

### 文件存储服务对比

| 服务 | 协议 | OS | 托管 | 适用 |
|------|------|-----|------|------|
| **EFS** | NFS | **Linux** | 全托管 | 多 EC2 共享文件系统，POSIX 兼容 |
| **FSx for Windows** | **SMB** | **Windows** | 全托管 | Windows 文件共享，Active Directory 集成 |
| **FSx for Lustre** | Lustre | Linux | 全托管 | **HPC**，高性能并行存储，可链接 S3 |
| **FSx for ONTAP** | NFS+SMB | 双平台 | 全托管 | Linux+Windows 混合，NFS+SMB 双协议 |
| **Storage Gateway 文件网关** | NFS/SMB | 混合 | 半托管 | 本地访问 + S3 后端，混合云 |

**选择逻辑：**
- **SMB + 全托管** → FSx for Windows
- **Linux 多实例共享 + POSIX** → EFS
- **HPC 并行高性能** → FSx for Lustre
- **NFS + SMB 双协议（Linux+Windows 混合）** → FSx for ONTAP
- **本地应用低延迟访问 + 云端备份（SMB/NFS）** → Storage Gateway 文件网关

### Storage Gateway 类型

| 类型 | 协议 | 本地存储 | 云端 |
|------|------|---------|------|
| **文件网关** | NFS/SMB | 缓存 | S3 |
| **卷网关（缓存模式）** | iSCSI | **最近访问数据**（本地缓存） | S3（主存储） |
| **卷网关（存储模式）** | iSCSI | **全量数据**（本地主存储） | S3（异步备份） |
| **磁带网关** | iSCSI VTL | 虚拟磁带 | S3/Glacier |

- 只需最近访问数据本地 + 其余在云 → **卷网关缓存模式**
- iSCSI + 本地低延迟 + 云备份 → **卷网关**

---

## 数据库服务

### RDS 高可用与性能

**Multi-AZ 部署：**
- 同步复制到备用实例
- 自动故障转移（通常 < 2 分钟，RDS PostgreSQL Multi-AZ 集群 < 35秒，甚至 < 1 秒 RPO）
- 备用实例**不接受读流量**（仅容灾）

**只读副本（Read Replica）：**
- 异步复制，可跨区域
- 主要用途：**分流读负载**、报告查询
- 创建读副本前需：① 启用自动备份（保留期 > 0）② 等待长事务完成

**RDS Proxy：**
- 场景：Lambda 大量并发 / 无服务器应用 导致数据库**连接数耗尽**
- 原理：连接池化，减少直接连接数
- 故障转移时间减少最多 **66%**

### RDS 加密

**未加密 RDS 加密流程（必考！）：**
1. 创建现有实例的快照
2. 复制快照时**启用加密**（创建加密副本）
3. 从加密快照**恢复**新数据库实例
4. 将应用迁移到新加密实例

> ❌ 不能在现有实例上直接启用加密（创建后不能修改）

### Aurora 特有功能

| 功能 | 说明 |
|------|------|
| **Aurora 副本** | 最多 15 个，分流读流量，故障自动提升为主 |
| **Aurora Global Database** | 跨区域复制，< 1 秒延迟，DR 快速切换 |
| **Aurora 多主（Multi-Master）** | 多写节点，适合高写入场景 |
| **Aurora 克隆（Clone）** | 快速创建副本，不影响源数据库（比 mysqldump 快得多） |
| **Aurora Serverless** | 自动扩缩容，适合间歇性/不可预测工作负载 |
| **Aurora Auto Scaling** | 动态添加/删除读副本 |

- 开发/测试需要生产数据 → **Aurora 数据库克隆**（快速，数分钟）
- 全球多区域写入 → **Aurora Global Database**
- 间歇性使用的 MySQL 兼容数据库 → **Aurora Serverless**

### DynamoDB

**容量模式：**
| 模式 | 场景 |
|------|------|
| **按需（On-Demand）** | 流量不可预测、突发峰值、新应用 |
| **预置 + Auto Scaling** | 流量可预测，稳定 |
| **预置（固定）** | 恒定可预测，节约成本 |

**备份方式：**
| 方式 | 窗口 | 用途 |
|------|------|------|
| **PITR（时间点恢复）** | 最近 **35 天**滚动 | 快速恢复数据损坏（RPO 15分钟） |
| **按需备份（AWS Backup）** | 自定义，最长 7 年 | 长期合规存档 |

**DynamoDB 其他关键特性：**
- **DAX（DynamoDB Accelerator）**：内存缓存，微秒延迟，**无需修改应用代码**
- **DynamoDB Streams**：捕获表变更 → 触发 Lambda（消费流数据）
- **TTL（Time To Live）**：自动删除过期项目，减少存储成本
- **Global Tables**：多区域主动-主动，**但数据损坏时无效**（需 PITR 备份）

### ElastiCache

| 引擎 | 特点 | 场景 |
|------|------|------|
| **Redis** | 支持持久化、主从、集群、排行榜、会话管理 | 亚毫秒延迟，复杂数据结构 |
| **Memcached** | 简单高速缓存，多线程 | 简单键值缓存 |

- 读取密集型，减少 RDS 负载 → **ElastiCache**
- 会话管理（Session Store）→ **ElastiCache for Redis**
- 排行榜（亚毫秒）→ **ElastiCache for Redis**

> ❌ 若数据是动态新数据（如新上映电影数量），不适合 ElastiCache；应用**只读副本**

### Redshift

- 列式存储数据仓库，适合 **PB 级 OLAP 分析**
- 流式摄取：直接从 Kinesis Data Streams 摄取
- ❌ 不适合少量数据（GB 级）的简单 SQL 查询（用 Athena 更便宜）

---

## 安全与加密

### Secrets Manager vs Parameter Store

| 对比 | Secrets Manager | SSM Parameter Store |
|------|----------------|---------------------|
| **数据库凭证轮换** | ✅ **原生自动轮换** | ❌ 需自定义 Lambda |
| 费用 | 收费 | 免费（标准层） |
| 加密 | KMS | KMS（SecureString） |
| 推荐场景 | **数据库凭证、API 密钥** | 配置参数、应用配置 |

> **凭证不硬编码 + 自动轮换** → **AWS Secrets Manager**（高频考点！）

### KMS 加密

**SSE-KMS 与 CMK：**
- 自动轮换：启用后每 **365 天**自动生成新加密材料
- 旧加密材料永久保留（解密历史数据）
- 审计密钥使用：**CloudTrail**

**S3 加密方式：**
| 类型 | 密钥管理 | 审计 | 自动轮换 | 合规 |
|------|---------|------|---------|------|
| SSE-S3 | AWS 管理 | ❌ | 自动 | 最简单 |
| **SSE-KMS** | 客户/AWS 管理 | **✅ CloudTrail** | 可配置 | **审计+轮换需求** |
| SSE-C | 客户自管 | ❌ | 手动 | 自带密钥 |

**需要审计 + 年度轮换** → **SSE-KMS + CMK 自动轮换**

### IAM 最佳实践

- **不使用 root 用户**（root 只用于首次设置）
- 为 EC2 附加 **IAM 角色**（不是 IAM 用户凭证）
- 为 Lambda 创建 **IAM 执行角色**（包含 Lambda 为可信服务）
- **最小权限原则**：只授予需要的权限
- **IAM 策略不直接附加用户**（通过组管理）

**IAM 策略评估顺序：**
- 显式 **Deny** 优先于所有 Allow
- 默认拒绝所有（隐式 Deny）

### WAF / Shield / Firewall Manager

| 服务 | 防护 | 使用场景 |
|------|------|---------|
| **AWS WAF** | SQL 注入、XSS、IP 封锁、速率限制 | ALB/CloudFront/API Gateway 前 |
| **AWS Shield Standard** | 自动 DDoS 防护（免费） | 所有客户默认 |
| **AWS Shield Advanced** | 增强 DDoS + 成本保护 | ELB/EC2/CloudFront/Global Accelerator |
| **AWS Firewall Manager** | **跨账户、跨区域**统一管理 WAF | 多账户组织级安全策略 |
| **AWS Network Firewall** | VPC 内流量检查和过滤 | 替代本地检查服务器 |

- **跨账户/跨区域统一 WAF** → **Firewall Manager**
- **阻止 CIDR 范围的 IP** → **网络 ACL**（安全组不支持拒绝规则）
- **速率限制（Rate Limiting）** → **WAF 基于速率规则**
- **DDoS 保护 + ELB/EC2/CloudFront** → **Shield Advanced**

### ACM 证书

- **ACM 颁发**证书：支持自动续期，部署到 ALB/CloudFront/API Gateway
- **导入**第三方证书：不支持自动续期，需手动轮换
- 证书必须与 API Gateway 在**同一区域**（区域 API）

### Organizations 与 SCP

- **SCP（服务控制策略）**：限制成员账户最大可用权限
- 限制区域（如只用 ap-northeast-3）→ **SCP 拒绝其他区域**
- 禁止 VPC 连接互联网 → **SCP**
- 多账户 SSO + 本地 AD → **AWS IAM Identity Center（SSO）+ AD Connector/Managed AD**

### AMI 跨账户共享（含加密）

1. 修改 AMI 的 `launchPermission`，仅与目标账户共享
2. 修改 **KMS 密钥策略**，允许目标账户使用该密钥
3. 目标账户可使用 AMI 启动实例

---

## 消息队列与事件驱动

### SQS 标准队列 vs FIFO 队列

| 对比 | 标准队列 | FIFO 队列 |
|------|---------|---------|
| 顺序 | 近似有序 | **严格保证顺序** |
| 重复 | 至少一次（可能重复） | **精确一次** |
| 吞吐量 | 无限 | 300/3000 TPS |
| 队列名 | 任意 | 必须以 **.fifo** 结尾 |

**可见性超时（Visibility Timeout）：**
- 消费者处理期间消息对其他消费者不可见
- 若处理超时 → 消息重新可见 → **重复处理**
- 解决重复处理：**增大可见性超时**（`ChangeMessageVisibility`）
- ❌ 错误：消息未重复时不需要 FIFO 队列

**SQS 优先级队列：**
- 付费用户优先 → **两个独立 SQS 队列**（付费+免费），消费者优先轮询付费队列

**SQS 扩展客户端（Extended Client Library）：**
- SQS 消息最大 256 KB
- 大消息（最大 2 GB）→ 消息存 S3，SQS 存引用

**SQS 长轮询（Long Polling）：**
- 减少空请求，降低成本

### SNS

- **扇出（Fan-out）**：一条消息推送给多个 SQS/Lambda/HTTP 目标
- **SNS FIFO**：保证消息顺序（与 SQS FIFO 结合使用）
- SNS 调用 Lambda 失败 → 配置 **SQS 作为死信队列（DLQ）** 持久化未处理消息

### Amazon MQ

- 迁移本地 **RabbitMQ / ActiveMQ** 的托管方案
- 支持**活动/备用（Active/Standby）**跨 AZ 高可用
- 比自建 EC2 上的 MQ 运维开销更低

### Kinesis

| 组件 | 特点 | 用途 |
|------|------|------|
| **Kinesis Data Streams** | 实时流，自定义消费，可重放，默认保留 24 小时 | 实时处理，复杂消费者 |
| **Kinesis Data Firehose** | 全托管，交付到 S3/Redshift/OpenSearch，支持 Lambda 转换 | **最简单的数据管道** |
| **Kinesis Data Analytics** | 流数据实时 SQL 分析 | 实时指标计算 |

**实时数据摄取（最小运维）：**
```
API Gateway → Kinesis Data Streams → Kinesis Data Firehose（Lambda 转换）→ S3
```

❌ 陷阱：
- Kinesis 是**流式**服务，不适合月度批量报告
- Kinesis Firehose 无法直接写入 DynamoDB（只能写 S3/Redshift/OpenSearch）
- Kinesis 默认保留 24 小时，超过 24 小时需扩展保留期

### EventBridge

- 比 S3 事件通知**功能更强**：支持更多目标（SageMaker、Step Functions 等）、事件过滤
- 定时任务 → **EventBridge 规则（cron/rate）+ Lambda**
- 跨账户事件路由

### Step Functions

- 协调多个 Lambda / AWS 服务的**工作流**
- 支持**人工审批**步骤
- 替代复杂 Lambda 嵌套，提供可视化工作流

---

## 数据迁移与传输

### 服务选择矩阵

| 场景 | 推荐服务 |
|------|---------|
| **数据库**迁移（同构/异构） | **AWS DMS** |
| 文件/对象数据网络迁移 | **AWS DataSync** |
| 大批量数据（无/限制带宽） | **Snowball Edge** |
| 超大规模（> 10 PB） | **Snowmobile** |
| 本地 NFS/SMB 文件 + 云访问 | **Storage Gateway** |
| 数据格式转换（ETL） | **AWS Glue** |

### Snowball 系列

| 设备 | 容量 | 场景 |
|------|------|------|
| Snowcone | 8 TB | 少量数据/边缘 |
| **Snowball Edge Storage Optimized** | **80 TB** | 大量数据离线迁移 |
| Snowmobile | 100 PB | 超大规模 |

**容量计算示例：**
- 150 TB，100 Mbps 夜间带宽（6 小时 ≈ 2.1 TB/天）→ 需 **2 个 Snowball Edge**
- 50 TB，无网络带宽 → **Snowball Edge + AWS Glue ETL**

### AWS DataSync

- 完全托管的数据传输服务
- 支持：本地 NFS/SMB/S3 → AWS（EFS/FSx/S3）
- 支持跨 AWS 区域传输（NFS ↔ NFS）
- 可通过 **Direct Connect** 传输（安全、可靠）
- 内置加密和完整性验证

❌ 陷阱：**DMS 用于数据库**，文件迁移用 DataSync

### AWS DMS（数据库迁移服务）

- 同构（MySQL → MySQL）和异构（Oracle → Aurora）迁移
- 支持**持续复制（CDC）**：迁移过程中源数据库保持在线
- 与 **SCT（Schema Conversion Tool）** 配合异构迁移

### AWS Glue

- **无服务器 ETL** 服务
- 支持 CSV → Parquet 转换
- Glue 作业书签（Job Bookmark）：避免重复处理已处理数据
- Glue 数据目录：元数据存储，与 Athena/Redshift Spectrum 集成

---

## CDN与全球加速

### CloudFront vs Global Accelerator

| 对比 | CloudFront | Global Accelerator |
|------|-----------|-------------------|
| 类型 | CDN，有边缘缓存 | 网络加速，无缓存 |
| 协议 | HTTP/HTTPS | **TCP/UDP** |
| IP | 动态 | **静态 Anycast IP** |
| 延迟优化 | 缓存减少回源 | 优化路由路径 |
| 适用 | 静态/动态内容缓存、视频流 | **游戏(UDP)、IoT、VoIP、需静态IP** |

**关键选择：**
- **UDP + 静态 IP + 路由到最近边缘** → **Global Accelerator + NLB**
- **全球用户访问静态/动态内容、降低延迟** → **CloudFront**
- **CloudFront 支持自定义源（Custom Origin）**：可指向本地服务器、ALB 等

### Route 53 路由策略

| 策略 | 使用场景 |
|------|---------|
| **简单** | 单资源，无健康检查 |
| **加权** | A/B 测试，按比例分流 |
| **延迟** | 路由到延迟最低的区域 |
| **地理位置** | 按用户地理位置路由（合规） |
| **地理邻近** | 按地理位置+偏向值路由 |
| **故障转移（主动-被动）** | 健康检查 + 故障切换（DR） |
| **多值应答** | 返回**多个健康端点 IP** |

- 返回所有健康 EC2 实例 IP → **多值应答路由**
- 主站故障切换到 S3 静态页面 → **Route 53 主动-被动故障转移**
- 不同国家用户访问不同内容 → **地理位置路由**
- 全球用户访问最近区域 → **延迟路由**
- Canary 发布 API → **加权路由**

### CloudFront 高级功能

- **Lambda@Edge**：在边缘节点运行 Lambda，处理 Viewer/Origin 请求（图像调整、A/B 测试）
- **签名 URL / 签名 Cookie**：限制内容访问
  - 签名 URL：不支持 Cookie 的客户端（每个文件一个 URL）
  - 签名 Cookie：需要访问多个文件，无法更改 URL
- **字段级加密（Field-Level Encryption）**：保护特定字段（如信用卡号）
- **WAF + CloudFront**：SQL 注入、XSS 防护，需在 us-east-1 创建 WAF

---

## 监控与运维

### CloudWatch

**CloudWatch 默认不采集的指标（需 CloudWatch Agent）：**
- EC2 内存使用率
- EC2 磁盘空间（实例存储）
- 进程数量

**告警类型：**
- **标准告警**：基于单个指标
- **复合告警（Composite Alarm）**：组合多个告警条件（AND/OR），**减少误报**
- 场景：CPU > 50% **AND** 磁盘读 IOPS 高 → 才告警 → **复合告警**

**CloudWatch Logs 订阅：**
- 实时推送到 OpenSearch → **CloudWatch Logs 订阅过滤器**（最小运维）

### AWS CloudTrail

- 记录**所有 AWS API 调用**（操作者、时间、IP）
- 审计 IAM 用户的操作 → **CloudTrail**
- 审计 KMS 密钥使用 → **CloudTrail**
- 配置变更 + API 历史 → **CloudTrail + AWS Config**

### AWS Config

- 评估 AWS 资源**配置合规性**
- 内置规则：`acm-certificate-expiration-check`、S3 公共访问检查等
- 不合规 → **Config → EventBridge → SNS/Lambda**
- 确认哪些 IAM 用户策略直接附加到用户 → **Config 规则**

### AWS Systems Manager

- **Session Manager**：无需 SSH 密钥，浏览器/CLI 安全连接 EC2
- **Patch Manager**：批量修补 OS 漏洞
- **Parameter Store**：存储配置参数（加密或明文）
- 使用 Systems Manager 管理 EC2 → 需要 **接口 VPC 端点**（无互联网访问时）

### 成本监控

- **AWS Cost Explorer**：查看历史成本，预测，RI 推荐
- **AWS Budgets**：设置预算告警（超过阈值通知）→ 监控 EC2 使用量超出阈值
- **AWS Trusted Advisor**：最佳实践建议（RI 推荐、安全检查等）
- **S3 Storage Lens**：分析 S3 访问模式，识别不常访问的存储桶

### AWS Inspector

- 自动安全评估（漏洞扫描）
- 与 Patch Manager 配合：Inspector 扫描 → Patch Manager 修补

---

## 大数据与分析

### 分析服务对比

| 服务 | 类型 | 适用场景 |
|------|------|---------|
| **Athena** | 无服务器 SQL | 查询 **S3 数据**，按查询付费 |
| **Redshift** | 数据仓库 | **PB 级 OLAP**，复杂分析 |
| **EMR** | Hadoop/Spark | 大规模自定义数据处理 |
| **QuickSight** | BI 可视化 | 仪表盘、图表 |
| **OpenSearch** | 搜索+分析 | 日志搜索、ELK 替代 |
| **Kinesis Analytics** | 实时 SQL | 流数据实时分析 |
| **Lake Formation** | 数据湖管理 | 列级/行级访问控制，细粒度权限 |
| **Glue** | ETL | 数据格式转换，目录管理 |

**常见分析架构：**
- 月度成本报告（S3 数据）→ **Athena**（Kinesis 是流式，不适合月度）
- 每天 3 GB，< 10 次查询 → **DMS → S3 + Athena**（比 Redshift 便宜）
- 实时流数据 → **Kinesis Data Streams → Lambda/Analytics**
- 点击流分析（30TB/天）→ **Kinesis → Redshift 流式摄取**

### Athena 性能优化（考点）

- 使用**列式格式**（Parquet、ORC）→ 减少扫描数据量
- 按日期/区域**分区**（Partition）→ 减少扫描分区
- **压缩**文件
- 避免大量小文件（合并为较大文件，< 128 MB 的小文件影响性能）

### QuickSight 访问控制

- 管理账户控制用户仪表盘访问
- 与 S3、Athena、RDS、Redshift 集成
- 分享仪表盘给特定用户（无需 AWS 账户）→ **QuickSight 仪表盘共享**

### Amazon Macie

- 自动发现和保护 **S3 中的 PII**（个人身份信息）
- 发现 PHI/PII → 发布到 **EventBridge** → 触发 SNS 通知

---

## 容器与无服务器架构

### ECS vs EKS

| 对比 | ECS | EKS |
|------|-----|-----|
| 编排 | AWS 原生 | **Kubernetes** |
| 学习曲线 | 较低 | 较高 |
| 适用 | 一般容器化应用 | 已使用 K8s、需 K8s 生态 |
| 存储 | EFS、EBS | EFS、EBS（通过 CSI 驱动） |

- **现有 Kubernetes 集群迁移，不改代码** → **EKS**
- **最小运维的容器部署** → **ECS + Fargate**

### Fargate

- **无需管理底层 EC2**的容器运行时
- 配合 ECS 或 EKS 使用
- 自动扩缩（Application Auto Scaling）
- 容器化应用 + 最小运维开销 → **ECS + Fargate + ALB**

### 典型无服务器架构

```
用户 → API Gateway → Lambda → DynamoDB
                           ↓
                          S3（文件存储）
                           ↓
                     RDS Proxy → Aurora（需要关系型）
```

**静态网站无服务器：**
```
S3（静态托管）→ CloudFront（HTTPS）→ Route 53
```

### Elastic Beanstalk

- 全托管 PaaS，支持 Java/PHP/Python/.NET/Docker 等
- 自动处理容量、负载均衡、Auto Scaling、健康监控
- 支持 URL 交换（蓝绿部署）
- 适合：快速部署且需要最小运维的 Web 应用

### AWS Batch

- 全托管批处理服务
- 适合：超过 15 分钟的批处理作业（Lambda 超时限制）
- 根据作业大小和数量自动扩展 EC2/Spot

---

## 成本优化

### EC2 购买方式

| 方式 | 折扣 | 适用场景 | 注意 |
|------|------|---------|------|
| **On-Demand** | 无 | 短期/不可预测 | 随时启停 |
| **Reserved（1/3年）** | 最高 72% | **稳定长期运行**（生产） | 需承诺 |
| **Savings Plans** | 最高 72% | 灵活承诺（Compute SP 覆盖 EC2+Fargate+Lambda） | |
| **Spot** | 最高 90% | **可中断**的批处理/无状态 | 随时可能被终止 |
| **Dedicated Host** | 无折扣 | 软件许可（插槽/核心绑定） | 最贵 |

**Savings Plans 类型：**
- **EC2 Instance SP**：72% 折扣，限定实例系列+区域
- **Compute SP**：66% 折扣，**自动适用于 EC2/Fargate/Lambda**

**常见组合策略：**
- 生产（稳定运行）→ **预留实例** 或 **EC2 Instance Savings Plans**
- 弹性扩展部分 → **按需实例**（不用 Spot，生产不可中断）
- 可中断批处理（> 15 分钟）→ **Spot**
- Fargate + Lambda 的前端/API（可预测）→ **Compute Savings Plans**
- 最小容量（始终需要）→ **预留实例**；峰值扩展 → **按需**

### RDS/Aurora 成本优化

- 非生产数据库（白天 12 小时访问）→ **EventBridge + Lambda 定时启停 RDS**
- 按月运行测试，其余时间不用 → **手动快照 + 删除实例 + 从快照恢复**（比停止更省）
- 开发数据库 → **Aurora Serverless**（按使用付费）

### S3 成本优化

- 不知道访问模式 → **S3 Intelligent-Tiering**
- 已知访问模式 → **S3 生命周期策略**（精确转换）
- 共享数据但不想承担流量费 → **Requester Pays**
- 减少 NAT 网关 S3 流量费 → **S3 网关端点**

---

## 灾难恢复与高可用

### DR 策略级别

| 策略 | RPO/RTO | 成本 | 特征 |
|------|---------|------|------|
| **备份与恢复** | 高（小时） | 最低 | 定期备份，故障时恢复 |
| **Pilot Light（领航灯）** | 中（分钟） | 低 | 核心组件常驻，其他组件关闭 |
| **Warm Standby（温备）** | 低（分钟） | 中 | 缩减规模运行，快速扩展 |
| **Multi-Site（主动-主动）** | 极低（秒） | 最高 | 两侧同时处理流量 |

### Route 53 故障转移

**主动-被动（Failover）：**
- 健康主站 → 流量全到主站
- 主站失败 → 切换到备用（S3 静态页/备用区域）
- 适合：DR 场景，备用不需要处理正常流量

**主动-主动：**
- 两边同时处理流量
- 使用延迟/地理位置/加权路由

### 多 AZ vs 多 Region

**多 AZ（同区域高可用）：**
- RDS Multi-AZ：同区域自动故障转移
- Auto Scaling 跨 AZ：实例均衡分布

**多 Region（跨区域灾备）：**
- Aurora Global Database：跨区域读副本，故障切换
- Route 53 故障转移：健康检查 + 切换
- DynamoDB Global Tables：多区域主动-主动

### RPO/RTO 对应方案

| RPO/RTO 要求 | 方案 |
|-------------|------|
| RPO < 1 秒 | RDS Multi-AZ（同步复制），Aurora Multi-AZ |
| RPO ≈ 5 分钟 | PITR + 频繁备份 |
| RPO ≤ 15 分钟 | DynamoDB PITR |
| RTO ≈ 35 秒 | Aurora Multi-AZ 集群故障转移 |
| RTO < 40 秒 | RDS Multi-AZ DB 集群 |
| 停机容忍 30 分钟 | Aurora 副本（主动-被动） |

### AWS Backup

- 统一管理 EC2/EBS/RDS/DynamoDB/EFS/Aurora 的备份
- 支持跨区域备份（DR）
- 生命周期策略：N 天后转冷存储，M 天后过期
- **DynamoDB 保留 7 年** → **AWS Backup**（PITR 只有 35 天）

---

## AI/ML 服务

| 服务 | 功能 | HIPAA 合规 |
|------|------|-----------|
| **Amazon Textract** | 从 **PDF/图像**提取文字 | ✅ |
| **Amazon Comprehend Medical** | 从文本识别 **PHI/医疗信息** | ✅ |
| **Amazon Rekognition** | 图像/视频分析（人脸、场景、文字检测） | ✅ |
| **Amazon Transcribe** | 语音转文字，支持多说话人识别、PII 编辑 | ✅ |
| **Amazon Polly** | 文字转语音 | |
| **Amazon SageMaker** | 自定义 ML 模型训练/部署 | |
| **Amazon Elastic Transcoder** | 视频格式转码 | |
| **Amazon Translate** | 文本翻译 | |
| **Amazon Pinpoint** | 营销推送（短信/邮件） | |
| **Amazon Connect** | 呼叫中心服务 | |

**关键考点：**
- 从 **PDF/JPEG 识别 PHI** → **Textract（提取文字）+ Comprehend Medical（识别 PHI）**
- ❌ Rekognition 不能提取 PDF 文字
- 图片审核（不适当内容）→ **Rekognition**
- 多说话人语音转文字 → **Transcribe**（支持 Speaker Diarization）
- 音频文件 PII 编辑 → **Transcribe**（内置 PII 编辑功能）

---

## ⚡ 高频解题关键词速查表

### 架构关键词 → 方案

| 题目出现的关键词 | 推荐方案 |
|---------------|---------|
| **数据库凭证不硬编码 + 自动轮换** | AWS Secrets Manager |
| **消息严格顺序** | SQS FIFO |
| **防止消息重复处理** | 增大 SQS 可见性超时 |
| **一消息 → 多目标系统** | SNS 扇出 → 多 SQS |
| **UDP + 静态 IP + 边缘路由** | Global Accelerator + NLB |
| **全球用户 + 内容缓存** | CloudFront |
| **最小运维的容器部署** | ECS + Fargate |
| **文件大量数据迁移（无带宽）** | Snowball Edge |
| **文件网络迁移（有带宽）** | DataSync |
| **内存密集型 + 性能问题** | 换用 R 系列 EC2 |
| **HPC 低延迟节点通信** | 集群置放群组 |
| **Lambda 并发导致数据库连接耗尽** | RDS Proxy |
| **数据库读负载高** | 只读副本 或 ElastiCache |
| **私有访问 S3/DynamoDB（不走公网）** | S3/DynamoDB 网关端点 |
| **私有访问 SSM/KMS 等服务** | 接口 VPC 端点 |
| **Windows 文件共享 SMB + 全托管** | FSx for Windows |
| **Linux 多实例共享文件系统** | EFS |
| **HPC 高性能并行文件系统** | FSx for Lustre |
| **NFS + SMB 双协议** | FSx for ONTAP |
| **本地访问 + S3 后端混合** | Storage Gateway 文件网关 |
| **多 VPC + 本地数据中心互联** | Transit Gateway + Direct Connect |
| **法规合规不可修改/删除** | S3 Object Lock 合规模式 |
| **防意外删除** | S3 版本控制 + MFA Delete |
| **跨账户 WAF 统一管理** | AWS Firewall Manager |
| **S3 数据共享，请求方付费** | Requester Pays |
| **日志实时推送到 OpenSearch** | CloudWatch Logs 订阅过滤器 |
| **月度/批量 S3 数据 SQL 查询** | Athena（非 Kinesis） |
| **多条件组合告警，减少误报** | CloudWatch 复合告警 |
| **主站故障 → 静态备用页** | Route 53 主动-被动故障转移 |
| **EC2 内存/磁盘指标** | 安装 CloudWatch Agent |
| **优先级队列（付费 vs 免费）** | 两个独立 SQS 队列 |
| **Kubernetes 集群，不改代码** | EKS |
| **> 15 分钟的批处理作业** | EC2 Spot 或 AWS Batch 或 Fargate |
| **从 PDF/图片识别医疗 PHI** | Textract + Comprehend Medical |
| **证书到期提前通知** | AWS Config 规则 + SNS |
| **访问模式未知的 S3 数据** | S3 Intelligent-Tiering |
| **工作流 + 人工审批步骤** | Step Functions |
| **CSV → Parquet 格式转换** | AWS Glue ETL |
| **大量 EC2 实例批量打补丁** | Systems Manager Patch Manager |
| **DynamoDB 亚微秒延迟 + 无需改代码** | DynamoDB DAX |
| **DynamoDB 自动删除过期数据** | DynamoDB TTL |
| **不定期使用的 MySQL 兼容数据库** | Aurora Serverless |
| **Spot 实例 + 容器 + 最低成本** | EKS 托管节点组（Spot）或 ECS |
| **EC2 开发/测试定时启停** | EventBridge + Lambda 定时触发 |
| **API 密钥控制 API 访问** | API Gateway 使用计划 + API Key |

### 最小运维开销 → 优先托管服务

```
托管程度（从低到高）：
EC2 自管 < Elastic Beanstalk < ECS+EC2 < ECS+Fargate（无 EC2）< Lambda（无服务器）
RDS 自管 < RDS < Aurora < Aurora Serverless
SQS/SNS 完全托管，优于 EC2 上自建 RabbitMQ/ActiveMQ → 选 Amazon MQ
```

### 常见陷阱汇总（❌ 避坑）

| 错误思路 | 正确答案 |
|---------|---------|
| NLB 可以检测 HTTP 应用错误 | ❌ NLB 只做 TCP；HTTP 健康检查需 ALB |
| DynamoDB 能用 EBS 快照备份 | ❌ DynamoDB 是无服务器，用 PITR/AWS Backup |
| Lambda 可以运行超过 15 分钟的任务 | ❌ 最大 15 分钟；长任务用 EC2/Batch/Fargate |
| 现有 RDS 实例上直接启用加密 | ❌ 创建后不能改；需快照→加密副本→恢复 |
| SSM Parameter Store 支持自动数据库密钥轮换 | ❌ 需自定义 Lambda；Secrets Manager 原生支持 |
| CloudFront 适合 UDP 流量 | ❌ 用 Global Accelerator |
| DMS 用于文件迁移 | ❌ DMS 是数据库迁移；文件用 DataSync |
| CloudWatch 默认采集 EC2 内存指标 | ❌ 需安装 CloudWatch Agent |
| SNS 可以持久化未处理消息 | ❌ SNS 无持久化；失败消息用 SQS DLQ |
| Kinesis 适合月度批量报告 | ❌ Kinesis 是流式服务；月度查询用 Athena |
| Spot 实例适合生产关键应用（不可中断） | ❌ Spot 随时可被终止；生产用 Reserved/On-Demand |
| DynamoDB Global Tables 可恢复数据损坏 | ❌ Global Tables 是多活复制；数据损坏用 PITR |
| 网络 ACL 可以做 HTTP→HTTPS 重定向 | ❌ 用 ALB 监听器规则 |
| Rekognition 可以提取 PDF 文字 | ❌ 用 Textract |
| S3 接口端点比网关端点便宜 | ❌ 接口端点收费；S3/DynamoDB 用免费网关端点 |

---

> 📌 **备考建议：**
> 1. **重点关注服务边界**：Lambda 15分钟限制、SQS 256KB 限制、Kinesis 非月度报告等
> 2. **"最小运维开销"** = 优先选全托管/无服务器方案
> 3. **"最经济高效"** ≠ "最小运维"，要综合考虑
> 4. **多选题（选两个）**：两个选项要互补，共同解决问题
> 5. 熟记 **RDS 加密流程**、**VPC 端点类型**、**S3 存储类转换条件** 等硬性知识点

