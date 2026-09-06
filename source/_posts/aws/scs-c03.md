---
title: AWS SCS-C03 备考知识点整理
date: 2026-09-06 12:00:00
categories: AWS
tags:
  - SCS-C03
  - AWS
  - 安全
  - 认证
  - 备考
description: 基于 231 题题库归纳的 AWS Certified Security - Specialty（SCS-C03）高频考点总结，涵盖六大考试域核心考点、秒选规则与易错点清单。
keywords:
  - SCS-C03
  - AWS 安全认证
  - GuardDuty
  - KMS
  - IAM
  - CloudTrail
comments: true
toc: true
donate: true
share: true
---

如果说 SAA-C03 考的是「怎么把系统搭起来」（备考笔记见 {% post_link aws/saa-c03 %}），SCS-C03 考的就是「怎么守住它」。安全专项几乎没有死记硬背的送分题，几乎全是场景判断：题干丢给你一个业务需求，让你从一票 AWS 服务里挑出唯一的正解。

好在我把 231 道题库翻来覆去刷了几遍后发现，出题人的偏好其实非常稳定：**托管服务优先、组织级集中治理、可审计的不可变证据**。抓住这三条主线，大部分题都能秒选。本文是刷题后的考点归纳，用于考前突击抓重点，不替代官方文档。

{% alertpanel info "SCS-C03 是什么" %}
**AWS Certified Security – Specialty（SCS-C03）** 是 AWS 安全方向的专家级认证，2025 年 12 月起取代 SCS-C02。考试共 **65 题**（50 道计分 + 15 道不计分），时长 **170 分钟**，通过线为 1000 分制下的 **750 分**，证书有效期 3 年。

官方考纲共六大域：

| 考试域 | 权重 | 题库中的复习重点 |
| --- | ---: | --- |
| Identity and Access Management | 20% | IAM 策略评估、角色信任、STS、SCP、临时凭证、跨账户访问 |
| Infrastructure Security | 18% | VPC、SG/NACL、WAF、Shield、Session Manager、Inspector |
| Data Protection | 18% | S3、KMS、CloudHSM、Object Lock、Secrets Manager、备份恢复 |
| Detection | 16% | CloudTrail、CloudWatch、GuardDuty、Security Hub、Macie、Config |
| Incident Response | 14% | 凭证泄露遏制、取证日志、自动化修复、DR、根因分析 |
| Security Foundations and Governance | 14% | Organizations、委派管理员、StackSets、Control Tower、合规审计 |
{% endalertpanel %}

<!-- more -->

## 题库画像：它到底在考什么

先看统计。对 231 道题做全文关键词近似统计后，出现频次最高的服务及其典型答案模式如下：

| 高频服务/概念 | 全文出现次数 | 题库关注点 | 典型答案模式 |
| --- | ---: | --- | --- |
| Amazon S3 | 约 550+ | 日志集中、Object Lock、bucket policy、签名 URL | `Object Lock` 保不可变；bucket policy 优于 ACL |
| IAM | 约 525+ | 策略评估、角色、临时凭证、跨账户 | 显式 Deny 优先；跨账户看 trust + permission policy |
| EC2 | 约 380+ | 实例角色凭证、IMDSv2、Session Manager | 凭证被盗先撤销会话；远程管理优先 Session Manager |
| KMS | 约 330+ | key policy、Grant、CloudHSM、审计 | 临时授权用 Grant；审计看 CloudTrail |
| VPC | 约 220+ | Flow Logs、SG/NACL、端点 | 网络流量看 Flow Logs，不看 CloudTrail |
| Lambda | 约 220+ | 自动化修复、日志权限 | 无日志先查执行角色缺 CloudWatch Logs 权限 |
| GuardDuty | 约 190+ | 托管威胁检测、组织启用 | 组织级启用 + 委派管理员；检测不是阻断 |
| CloudTrail / CloudWatch | 各约 180+ | API 审计、日志告警 | 组织级跟踪写安全账户 S3 |
| WAF | 约 180+ | L7 规则、Rate-based | string match 匹配 Header/User-Agent |
| AWS Config | 约 120+ | 持续合规、自动修复 | managed rule + EventBridge + SNS |
| StackSets | 约 120+ | 多账户 IaC 部署 | delegated admin + 自动部署到未来账户 |
| SCP | 约 110+ | 组织权限护栏 | Deny + NotAction + RequestedRegion |

> 频次为题库文本近似统计，用于判断「题库反复强调哪些服务」，不代表官方权重。

把这些数字读一遍，题库的三大倾向就浮出水面：

- **最少运维**：凡是能交给 AWS 托管的（GuardDuty、Config、Macie、Inspector、Security Hub），绝不自写 Lambda 分析日志，除非题目明确要求自定义逻辑。
- **组织级集中治理**：出现「所有现有和未来账户」基本就是 Organizations + 委派管理员 + StackSets/服务自动启用。
- **可审计 / 不可变证据**：审计走 CloudTrail，网络流量走 Flow Logs，不可变落 S3 Object Lock 合规模式。

## 分域核心考点

### Detection：检测、日志与告警

核心服务：CloudTrail、CloudWatch Logs、GuardDuty、Security Hub、Macie、Inspector、AWS Config、VPC Flow Logs。

高频考点：

- **CloudTrail 是 AWS API 审计源**：谁在什么时候从哪调用了什么 API。组织环境优先用 **organization trail**。
- **CloudTrail 不记录普通网络流量**：NTP、端口连接、东西向流量要看 **VPC Flow Logs**、Transit Gateway Flow Logs、Route 53 Resolver logs。
- **CloudWatch Logs 管日志存储/查询/告警**：Lambda 没有日志时，常见原因是执行角色缺 `logs:CreateLogGroup`、`logs:CreateLogStream`、`logs:PutLogEvents`。
- **GuardDuty 是托管威胁检测**：分析 CloudTrail、VPC DNS、Flow Logs、EKS 审计、RDS 登录等信号。
- **Security Hub 是 findings 聚合与合规视图**：不会替代 GuardDuty/Inspector/Macie 的检测。
- **Macie 关注 S3 敏感数据发现**；**Inspector 关注漏洞扫描**（EC2/ECR/Lambda）；**Config 关注配置合规**。

典型题型与答案：

| 题干关键词 | 优先选择 |
| --- | --- |
| 所有账户活动记录到安全账户 | CloudTrail organization trail + S3 |
| 日志不可更改/保留两年 | S3 Object Lock 合规模式 |
| 检测 EKS 未授权访问且最少配置 | GuardDuty EKS Protection |
| 检测 NTP 出站到公网 | VPC Flow Logs |
| Lambda 没有 CloudWatch Logs | 执行角色缺少 CloudWatch Logs 权限 |
| S3 中发现敏感数据 | Amazon Macie |
| EC2/ECR/Lambda 漏洞扫描 | Amazon Inspector |

### Incident Response：事件响应与恢复

核心服务：CloudTrail、GuardDuty、IAM、STS、Systems Manager、Step Functions、Lambda、Detective、AWS Backup、AWS Elastic Disaster Recovery。

高频考点：

- **凭证泄露第一步是遏制访问**：例如 GuardDuty 报 `UnauthorizedAccess:IAMUser/InstanceCredentialExfiltration`，应先撤销实例配置文件角色会话/轮换凭证，而不是先改安全组或装代理。
- **取证证据先保全**：保留 CloudTrail、CloudWatch Logs、VPC Flow Logs、磁盘快照。
- **根因分析用 Detective**：对 GuardDuty finding 做图谱化调查。
- **自动化响应**：EventBridge + Lambda / Step Functions / SSM Automation。
- **灾难恢复看 RPO/RTO**：给出「1 小时 RPO」就要选满足该目标的备份频率或连续复制。

典型题型与答案：

| 题干关键词 | 优先选择 |
| --- | --- |
| EC2 实例角色凭证从异常国家调用 API | 撤销实例配置文件关联角色的活动会话 |
| 本地服务器连续复制，RTO < 1 小时 | AWS Elastic Disaster Recovery |
| 勒索软件后要 1 小时 RPO 恢复 | AWS Backup 每小时备份 + IaC 重建 |
| DDoS 后减少未来停机 | Shield Advanced + AWS WAF |
| 自动修复不合规资源 | Config/EventBridge + Lambda/SSM Automation |

### Infrastructure Security：基础设施安全

核心服务：VPC、SG、NACL、Network Firewall、WAF、Shield Advanced、CloudFront、ALB、Route 53 Resolver DNS Firewall、Session Manager。

高频考点：

- **WAF 管 L7 HTTP/HTTPS 请求**：User-Agent、路径、Header、Rate-based rule、托管规则组。
- **Shield Advanced 管 DDoS 增强防护**：可联系 DDoS Response Team。
- **CloudFront + ALB 防绕过**：CloudFront 加自定义 Header，ALB/WAF 只允许带该 Header 的请求。
- **SG 有状态、NACL 无状态**：NACL 限制子网边界时注意返回流量。
- **Session Manager 满足无入站端口远程运维**：适合「SSH/RDP 不能暴露 + 需要审计」。

典型题型与答案：

| 题干关键词 | 优先选择 |
| --- | --- |
| 特定 IoT 设备 User-Agent 发起攻击 | WAF string match 检查 User-Agent |
| HTTP flood / Bot / OWASP Top 10 | AWS WAF 托管规则/速率限制 |
| 大规模 DDoS 专家响应 | Shield Advanced |
| 不能开放 SSH/RDP 且会话要审计 | Session Manager |
| 检查不必要网络访问 | Network Access Analyzer / Inspector network reachability |

### Identity and Access Management：身份与访问管理

核心服务：IAM、STS、IAM Identity Center、Organizations SCP、Cognito、IAM Access Analyzer、Policy Simulator。

高频考点：

- **IAM 策略评估顺序**：显式 Deny 永远优先；Allow 需要身份策略、资源策略、权限边界、SCP、会话策略共同允许。
- **跨账户访问看两边**：调用方身份策略允许 `sts:AssumeRole`，目标角色 trust policy 信任调用方。
- **SCP 是组织级护栏**：不授予权限，只限制成员账户最大可用权限。
- **区域限制 SCP 常见结构**：`Deny` + `NotAction` 例外全局服务 + `StringNotEquals aws:RequestedRegion`。
- **临时凭证优先 STS**：外部第三方用 `ExternalId` 防 confused deputy。
- **IAM Identity Center 管企业员工 SSO**；**Cognito 管应用终端用户**，两者不要混。

典型题型与答案：

| 题干关键词 | 优先选择 |
| --- | --- |
| 限制 OU 只能用 eu-west-1，保留全球服务 | SCP Deny + NotAction + `StringNotEquals aws:RequestedRegion` |
| 第三方跨账户 AssumeRole 防混淆代理 | ExternalId |
| 查找过宽权限/外部可访问资源 | IAM Access Analyzer |
| 排查授权失败 | IAM Policy Simulator / CloudTrail |
| 访问密钥 90 天未轮换通知 | Config `access-keys-rotated` + EventBridge + SNS |

### Data Protection：数据保护与加密

核心服务：KMS、CloudHSM、S3、Object Lock、Secrets Manager、ACM、Private CA、AWS Backup、DataSync。

高频考点：

- **KMS 是主线**：key policy、grant、rotation、data key、asymmetric key、multi-Region key 都是重点。
- **CloudHSM / KMS 自定义密钥存储**：题目要求密钥材料在 CloudHSM HSM 边界内生成和使用时，选 **KMS custom key store backed by CloudHSM**。
- **KMS Grant 用于临时/程序化授权**：不要频繁改 key policy，也不要导出密钥材料。
- **S3 Object Lock 合规模式用于 WORM**：保留期内即使 root 也不能删除/修改；**Lifecycle 不是不可变保护**。
- **传输中加密用强制策略**：bucket policy 拒绝 `aws:SecureTransport=false`，而不是只提醒客户端用 HTTPS。
- **Secrets Manager 管密钥轮换**：数据库凭证、API 密钥优先 Secrets Manager。

典型题型与答案：

| 题干关键词 | 优先选择 |
| --- | --- |
| KMS 密钥材料必须在 CloudHSM 集群中生成和使用 | KMS custom key store backed by CloudHSM |
| 应用团队偶尔需要临时使用 KMS key | KMS Grant，结束后撤销 |
| 不可变审计证据 | CloudTrail + S3 Object Lock 合规模式 + log file validation |
| 防止 S3 非 TLS 上传，包括预签名 URL | Bucket policy Deny `aws:SecureTransport=false` |
| S3 PII 发现 | Macie |
| 代码签名用非对称密钥并审计 | KMS asymmetric key + CloudTrail |

### Security Foundations and Governance：治理

核心服务：Organizations、Control Tower、CloudFormation StackSets、Config、Security Hub、Audit Manager、Artifact、Firewall Manager、RAM。

高频考点：

- **Organizations 多账户集中治理是题库重点**：出现「所有现有和未来账户」基本就是组织级能力。
- **避免使用管理账户做日常操作**：优先注册 delegated administrator。
- **StackSets 负责跨账户/跨区域一致部署**：启用自动部署覆盖未来账户。
- **Security Hub / GuardDuty / Macie / Inspector 可设置组织委派管理员**。
- **Config 做持续合规评估**：managed rule、Conformance Packs、自动修复、聚合器。
- **Firewall Manager 做组织级 WAF/Shield/Network Firewall 集中管理**；**Audit Manager / Artifact 偏审计证据和报告**。

典型题型与答案：

| 题干关键词 | 优先选择 |
| --- | --- |
| Lambda 合规监控部署到所有现有和未来账户 | CloudFormation delegated admin + StackSet 自动部署 |
| 组织级 GuardDuty/Security Hub 管理 | 指定委派管理员并自动启用成员账户 |
| Aurora 持续监控加密、删除保护、公开访问 | AWS Config 托管规则 |
| 收集合规证据/审计报告 | Audit Manager / Artifact |
| 统一部署 WAF 策略到多账户 | AWS Firewall Manager |

## 高频场景「秒选」规则

把上面六个域压缩成一张表，考前扫一眼：

| 场景关键词 | 秒选方向 | 避坑 |
| --- | --- | --- |
| 最少运维、托管检测 | GuardDuty / Config / Security Hub / Inspector / Macie | 不选自写 Lambda 分析日志 |
| 组织内所有现有和未来账户 | Organizations + delegated admin + StackSets/自动启用 | 不选逐账户手工部署 |
| 不可修改/不可删除/保留 N 年 | S3 Object Lock 合规模式 | Lifecycle 不能防删除 |
| AWS API 审计 | CloudTrail | CloudWatch Metrics 不是审计源 |
| 网络流量审计 | VPC Flow Logs / Resolver logs | CloudTrail 不看普通网络包 |
| KMS 临时授权 | KMS Grant | 不频繁改 key policy，不导出密钥 |
| 凭证被盗 | 撤销会话/轮换凭证 + CloudTrail 调查 | 第一步不装 Inspector/SSM 代理 |
| 防 S3 非 HTTPS | Bucket policy Deny `aws:SecureTransport=false` | Config 只能检测，不是实时阻断 |
| 无入站端口远程运维 | Session Manager | EC2 Instance Connect 仍依赖网络入站 |
| L7 攻击/特定 Header/User-Agent | AWS WAF | SG 不能看 HTTP Header |
| DDoS 专家支持 | Shield Advanced | GuardDuty 不负责 DDoS 缓解 |
| 本地服务器连续复制 DR | AWS Elastic Disaster Recovery | AWS Backup 不是连续复制 |

{% alertpanel warning "易错点清单" %}
1. **Security Hub 不是检测源**：它聚合 findings；检测来自 GuardDuty、Inspector、Macie、Config。
2. **GuardDuty 不等于阻断**：阻断靠 IAM 撤销、WAF、Network Firewall、安全组、自动化响应。
3. **CloudTrail 不记录普通网络流量**：网络层问题优先 Flow Logs、Resolver logs。
4. **S3 ACL 不是首选安全控制**：优先 bucket policy、IAM policy、Block Public Access。
5. **S3 Lifecycle 不是 WORM**：不可变必须 Object Lock 或 Glacier Vault Lock。
6. **KMS key policy 不适合频繁临时授权**：临时访问用 Grant。
7. **SCP 不授予权限**：只设最大权限边界，账户内仍需 IAM Allow。
8. **显式 Deny 优先**：IAM、SCP、bucket policy、key policy 中均成立。
9. **Config 检测合规，不一定阻断请求**：要「防止上传/阻止访问」就用策略 Deny。
10. **管理账户不做日常部署**：题库偏好 delegated administrator。
11. **WAF 只看 Web 请求层**：不能替代 Network Firewall 或安全组。
12. **Inspector 不分析日志**：它做漏洞/暴露面扫描。
13. **Macie 主要是 S3 敏感数据发现**：不要用于通用威胁检测。
14. **IAM Identity Center 与 Cognito 区分**：前者员工 SSO，后者应用用户。
15. **预签名 URL 仍受 bucket policy 约束**：可用 `aws:SecureTransport` 强制 HTTPS。
{% endalertpanel %}

{% alertpanel success "一页速记" %}
- API 审计：**CloudTrail**；网络流量：**VPC Flow Logs**
- 不可变日志：**S3 Object Lock 合规模式**
- 组织级日志：**CloudTrail organization trail**
- 组织级部署：**CloudFormation StackSets + delegated admin**
- 威胁检测：**GuardDuty**；Findings 聚合：**Security Hub**
- 漏洞扫描：**Inspector**；S3 敏感数据：**Macie**
- 配置合规：**AWS Config managed rules**
- S3 强制 HTTPS：bucket policy Deny `aws:SecureTransport=false`
- KMS 临时授权：**KMS Grant**；HSM 边界：**KMS custom key store backed by CloudHSM**
- 无端口远程访问：**Session Manager**
- L7 Web 防护：**AWS WAF**；DDoS 专家支持：**Shield Advanced**
- 本地连续复制 DR：**AWS Elastic Disaster Recovery**
- 应用用户认证：**Cognito**；企业员工 SSO：**IAM Identity Center**
{% endalertpanel %}

## 小结

1. **先背决策规则，再刷题**：SCS-C03 本质是「需求关键词 → 正确 AWS 控制」的场景判断题。
2. **把检测、阻断、审计分开**：GuardDuty 检测、WAF 阻断、CloudTrail 审计、S3 Object Lock 保全。
3. **多账户题优先 Organizations 视角**：委派管理员、StackSets、组织跟踪、自动启用成员账户是高频组合。
4. **KMS 掌握三层权限**：IAM policy、key policy、grant，并理解 CloudHSM/custom key store 的边界。
5. **S3 是综合高频服务**：bucket policy、Object Lock、Block Public Access、Macie、预签名 URL 都要熟。
6. **看到「最少运维」先排除自建脚本**：没有托管服务能满足需求时再考虑自定义方案。

祝顺利拿下 750+。
