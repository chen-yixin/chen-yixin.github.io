---
title: 使用 Let’s Encrypt 签发证书
date: 2025-02-23 17：00：00
categories: 命令行工具
tags:
  - tools
sticky: 0
#cover:
comments: true
toc: true
---

本站使用 Let’s Encrypt 免费获取泛域名 SSL 证书，并实现自动续期，操作记录整理。

<!-- more -->

## 环境准备

- 一台 Linux 服务器(本文`Debian 12`)
- 有 Root 权限
- 一个域名(本站`hoboro.top`)

## 安装 Cerbot

参考资料: [certbot](https://certbot.eff.org/instructions?ws=other&os=pip)

1. SSH 连接到 Server,更新 apt 源`sudo apt update`
1. 安装依赖`sudo apt install python3 python3-venv libaugeas0`
1. 创建 Python 虚拟环境`sudo python3 -m venv /opt/certbot/`
1. 更新 pip 版本`sudo /opt/certbot/bin/pip install --upgrade pip`
1. 安装 certbot`sudo /opt/certbot/bin/pip install certbot`
1. 配置软链接`sudo ln -s /opt/certbot/bin/certbot /usr/bin/certbot`

## 手动签发泛域名证书

参考资料: [使用 Let’s Encrypt 免费申请泛域名 SSL 证书，并实现自动续期](https://www.cnblogs.com/michaelshen/p/18538178)

Let’s Encrypt 要求通过 DNS-01 验证来申请泛域名证书。运行以下命令：

```sh
sudo certbot certonly --manual --preferred-challenges dns -d *.hoboro.top -d hoboro.top
```

此时,Let’s Encrypt 要求在 DNS 管理页面中,创建特定的 TXT 记录以验证域名的所有权,
在 DNS 解析那边配置 TXT 记录。
例如:

```
- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
Please deploy a DNS TXT record under the name:

_acme-challenge.hoboro.top.

with the following value:

XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX

- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
Press Enter to Continue
```

Let’s Encrypt 要求在 DNS 管理页面中,再创建特定的 TXT 记录以验证域名的所有权,
此时,不要删除前文设置好的 TXT 记录,根据再要求一个 TXT 记录。
例如:

```
- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
Please deploy a DNS TXT record under the name:

_acme-challenge.hoboro.top.

with the following value:

XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX

(This must be set up in addition to the previous challenges; do not remove,
replace, or undo the previous challenge tasks yet. Note that you might be
asked to create multiple distinct TXT records with the same name. This is
permitted by DNS standards.)

Before continuing, verify the TXT record has been deployed. Depending on the DNS
provider, this may take some time, from a few seconds to multiple minutes. You can
check if it has finished deploying with aid of online tools, such as the Google
Admin Toolbox: https://toolbox.googleapps.com/apps/dig/#TXT/_acme-challenge.hoboro.top.
Look for one or more bolded line(s) below the line ';ANSWER'. It should show the
value(s) you've just added.

- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
Press Enter to Continue
```

证书签发完毕

```
Successfully received certificate.
Certificate is saved at: /etc/letsencrypt/live/hoboro.top/fullchain.pem
Key is saved at:         /etc/letsencrypt/live/hoboro.top/privkey.pem
This certificate expires on 2025-01-01.
These files will be updated when the certificate renews.

NEXT STEPS:
- This certificate will not be renewed automatically. Autorenewal of --manual certificates requires the use of an authentication hook script (--manual-auth-hook) but one was not provided. To renew this certificate, repeat this same certbot command before the certificate's expiry date.

- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
If you like Certbot, please consider supporting our work by:
 * Donating to ISRG / Let's Encrypt:   https://letsencrypt.org/donate
 * Donating to EFF:                    https://eff.org/donate-le
- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
```

## 阿里云 DNS 自动签发泛域名证书

参考资料: [使用 Certbot 免费续期阿里云 SSL 证书](http://blog.mnxz.fun/index.html?model=articleInfo&id=10)

### 阿里云侧相关配置

**创建 RAM 账号**

RAM 是主账号的一个子用户, 可以按需给给该子用户最小的权限, 以保护主账号的安全

**创建 RAM 账户 RAM 访问控制**

身份管理 -> 用户 -> 创建用户

**获取 AccessKey ID 和 AccessKey Secret**

注意: 创建后获取到 AccessKey ID 和 AccessKey Secret 后应立即保存, 页面关闭后就看不到了

**添加需要的权限: `AliyunDNSFullAccess`**

### 安装 certbot-dns-aliyun

**安装 aliyun cli 工具**

```sh
# ROOT用户下
wget https://aliyuncli.alicdn.com/aliyun-cli-linux-latest-amd64.tgz
tar xzvf aliyun-cli-linux-latest-amd64.tgz
mv aliyun /usr/local/bin
```

**配置凭证**

```sh
# 填上上面获取到的 AccessKey ID，AccessKey Secret， 地域 Id（region）
aliyun configure set  --profile AkProfile --mode AK  --access-key-id **** --access-key-secret **** --region ****

# 激活刚配置的凭证
aliyun ecs DescribeInstances --profile AkProfile

# 凭证保留位置: `/root/.aliyun/`
```

**安装 certbot-dns-aliyun 插件**

```sh
wget https://cdn.jsdelivr.net/gh/justjavac/certbot-dns-aliyun@main/alidns.sh
sudo mv alidns.sh /usr/local/bin
sudo chmod +x /usr/local/bin/alidns.sh
sudo ln -s /usr/local/bin/alidns.sh /usr/local/bin/alidns
```

### 申请证书

使用 Certbot 申请证书时，我们需要指定 DNS 挑战，并调用 alidns 脚本自动添加 DNS 记录。以下是申请证书的命令：

```sh
certbot certonly  -d *.hoboro.top --manual --preferred-challenges dns --manual-auth-hook "alidns" --manual-cleanup-hook "alidns clean" --dry-run
```

参数说明

- -d example.com：指定域名（可以指定多个域名）。
- manual：手动模式。
- preferred-challenges dns：使用 DNS 挑战。
- manual-auth-hook "alidns"：在 DNS 挑战时调用 alidns 脚本。
- manual-cleanup-hook "alidns clean"：在 DNS 挑战完成后调用 alidns clean 脚本。
- —dry-run：模拟续期过程，不会实际续期证书。正式申请时去掉--dry-run 参数。

### 设置自动续期

Certbot 默认会在证书到期前 30 天内自动续期。我们可以通过设置 cron 任务来实现自动化续期。

**编辑 crontab**

```sh
sudo crontab -e
```

**添加续期任务**

```
0 2 * * * /usr/bin/certbot renew --quiet --preferred-challenges dns --manual-auth-hook "alidns" --manual-cleanup-hook "alidns clean" --deploy-hook "systemctl restart nginx" >> /var/log/certbot-renew.log 2>&1
```

参数说明

- 0 2 \*：每天凌晨 2:00 执行任务。
- `--quiet`：静默模式，减少日志输出。
- `--preferred-challenges dns`：指定使用 DNS 挑战。
- `--manual-auth-hook "alidns"`：在 DNS 挑战时调用 alidns 脚本。
- `--manual-cleanup-hook "alidns clean"`：在 DNS 挑战完成后调用 alidns clean 脚本。
- `--deploy-hook "systemctl restart nginx"`：在证书成功续期后重启 Nginx。

### 验证续期

**手动测试续期**

```sh
certbot renew --dry-run --preferred-challenges dns --manual-auth-hook "alidns" --manual-cleanup-hook "alidns clean"
```

如果测试成功，说明配置正确。

**检查证书状态**

运行以下命令查看证书的到期时间

```sh
certbot certificates
```
