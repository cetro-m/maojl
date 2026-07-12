# MAOJL.XYZ 部署指南

本文档基于 2026-07-12 对目标主机 `47.99.215.193` 的只读检查。检查期间未修改文件、服务、进程或网络配置。

## 服务器现状

| 项目 | 已确认状态 |
| --- | --- |
| 系统 | Ubuntu 22.04.5 LTS（x86_64） |
| Node.js | v24.15.0，路径 `/usr/bin/node` |
| pnpm | 10.33.0，路径 `/usr/bin/pnpm` |
| Nginx | 1.18.0，监听 80/443 |
| 现有应用 | `/var/www/site/web/.output/server/index.mjs`，监听 3000 |
| 现有域名 | `bioer.com`、`bioer.com.cn`、`en.bioer.com`、`cms.bioer.com` 等 |
| MAOJL 服务 | 尚无 `maojl.service`，尚无 `/var/www/maojl` |
| 计划端口 | 3010 当前未监听 |
| 域名解析 | 主机当前无法解析 `maojl.xyz`；上线前必须先修复 DNS |

现有 Bioer 应用是独立生产系统。部署 MAOJL 时不得复用或覆盖其目录、3000 端口、systemd 单元和 Nginx 配置。

## 目标结构

```text
Internet -> Nginx :80/:443 -> MAOJL Nitro 127.0.0.1:3010
                              systemd: maojl.service
                              files: /var/www/maojl

                            -> existing Bioer app 127.0.0.1:3000 (保持不变)
```

项目要求 Node.js >=22 和 pnpm >=11。服务器 Node 版本满足要求，但 pnpm 10.33.0 不满足 `package.json` 中的版本约束；正式部署前应为本项目准备 pnpm 11.11.0。不要在未评估现有应用的情况下直接替换系统级 pnpm。

使用 Corepack 显式调用项目固定版本，不要执行全局 `--activate`，以免改变现有 Bioer 应用使用的 pnpm：

```bash
corepack pnpm@11.11.0 --version
```

## 上线前置条件

1. 将 `maojl.xyz`（以及需要时的 `www.maojl.xyz`）A/AAAA 记录指向目标主机，并确认服务器可解析该域名。
2. 确认安全组和防火墙允许 80/443；不要开放 3010 到公网。
3. 备份将要修改的 Nginx 配置，并记录现有配置检查结果。
4. 确认 `/var/www/maojl`、`maojl.service` 和 3010 端口仍未被占用。

只读复核命令：

```bash
getent hosts maojl.xyz
ss -lntp | grep -E ':(80|443|3000|3010) '
systemctl status nginx --no-pager
systemctl status maojl --no-pager
nginx -t
```

## 首次部署

以下命令会修改服务器，只能在明确批准的维护窗口执行。

```bash
install -d -o www-data -g www-data -m 755 /var/www/maojl
install -d -o www-data -g www-data -m 755 /var/cache/maojl/corepack
sudo -u www-data git clone https://github.com/cetro-m/maojl.git /var/www/maojl
cd /var/www/maojl
sudo -u www-data env COREPACK_HOME=/var/cache/maojl/corepack corepack pnpm@11.11.0 install --frozen-lockfile
```

不要上传 Windows 本机生成的 `node_modules`、`.nuxt*` 或 `.output*`；原生依赖必须在 Linux 服务器安装和构建。

创建 `/etc/maojl/maojl.env`：

```dotenv
NODE_ENV=production
HOST=127.0.0.1
PORT=3010
NUXT_SITE_URL=https://maojl.xyz
NUXT_SITE_INDEXABLE=true
NUXT_OG_IMAGE_SECRET=<64-character-random-hex-secret>
```

建议权限：目录 `root:www-data 0750`，环境文件 `root:www-data 0640`。密钥可以用 `openssl rand -hex 32` 生成，禁止提交到 Git。

构建时必须先加载生产环境变量，因为站点 URL 和可索引状态会进入预渲染输出：

```bash
cd /var/www/maojl
set -a
source /etc/maojl/maojl.env
set +a
sudo -E -u www-data env COREPACK_HOME=/var/cache/maojl/corepack corepack pnpm@11.11.0 deploy:build
```

## systemd 单元

`/etc/systemd/system/maojl.service`：

```ini
[Unit]
Description=MAOJL.XYZ Nuxt server
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=www-data
Group=www-data
WorkingDirectory=/var/www/maojl
EnvironmentFile=/etc/maojl/maojl.env
ExecStart=/usr/bin/node /var/www/maojl/.output/server/index.mjs
Restart=on-failure
RestartSec=5
TimeoutStopSec=20
KillSignal=SIGTERM
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=full
ProtectHome=true
ReadWritePaths=/var/www/maojl

[Install]
WantedBy=multi-user.target
```

首次启用前先确认 `ExecStart`、工作目录、用户和 3010 端口均正确，再执行 `daemon-reload` 和启动操作。

## Nginx 独立站点

新增独立文件 `/etc/nginx/sites-available/maojl.xyz`，不要编辑或复用现有 Bioer 站点块：

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name maojl.xyz www.maojl.xyz;

    location / {
        proxy_pass http://127.0.0.1:3010;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_connect_timeout 10s;
        proxy_read_timeout 60s;
        proxy_send_timeout 60s;
    }
}
```

启用前后都运行 `nginx -t`。DNS 生效且 HTTP 验证通过后，再使用 Certbot 为 MAOJL 域名单独签发证书；不得改动 Bioer 证书或站点。

## 验收

先验证应用回环地址，再验证域名：

```bash
curl -I http://127.0.0.1:3010/
curl -I https://maojl.xyz/
curl -I https://maojl.xyz/robots.txt
curl -I https://maojl.xyz/sitemap.xml
curl -I https://maojl.xyz/rss.xml

cd /var/www/maojl
sudo -u www-data env COREPACK_HOME=/var/cache/maojl/corepack \
  SMOKE_BASE_URL=https://maojl.xyz corepack pnpm@11.11.0 test:smoke
```

同时确认：canonical、Open Graph、sitemap 和 RSS 均使用正式 HTTPS 域名；不存在页面返回 404；现有 Bioer 域名和 3000 端口服务不受影响。

## 更新与回滚

更新前记录当前提交，并先在独立目录构建。最稳妥的方式是使用带时间戳的 release 目录和 `current` 软链接原子切换，避免覆盖正在运行的 `.output`。

若仍采用单工作目录，至少执行：

```bash
cd /var/www/maojl
git status --short
git rev-parse HEAD
sudo -u www-data git pull --ff-only
sudo -u www-data env COREPACK_HOME=/var/cache/maojl/corepack corepack pnpm@11.11.0 install --frozen-lockfile
set -a
source /etc/maojl/maojl.env
set +a
sudo -E -u www-data env COREPACK_HOME=/var/cache/maojl/corepack corepack pnpm@11.11.0 deploy:build
systemctl restart maojl
systemctl status maojl --no-pager
sudo -u www-data env COREPACK_HOME=/var/cache/maojl/corepack \
  SMOKE_BASE_URL=https://maojl.xyz corepack pnpm@11.11.0 test:smoke
```

不要使用 `git reset --hard` 清除服务器上的未知改动。回滚应切换到已记录的已知良好提交或 release 目录，重新启动 `maojl`，再执行冒烟测试。

## 常用只读排查

```bash
systemctl status maojl --no-pager
journalctl -u maojl -n 100 --no-pager
ss -lntp | grep 3010
curl -I http://127.0.0.1:3010/
tail -n 100 /var/log/nginx/error.log
nginx -t
```

任何变更操作都应限定在 `/var/www/maojl`、`maojl.service` 和 MAOJL 自己的 Nginx 站点文件内。
