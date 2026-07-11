# MAOJL.XYZ 服务器部署指南

本文档使用以下生产结构：

```text
Internet -> Nginx :80/:443 -> Nuxt Nitro 127.0.0.1:3010
                              systemd: maojl.service
```

项目包含 RSS 服务端路由和动态 OG 图片能力，因此推荐使用 Node.js
服务器部署，而不是只上传静态文件。

## 1. 服务器要求

- 一台 Ubuntu 22.04/24.04 或兼容的 Linux 服务器。
- 已解析到服务器公网 IP 的域名，例如 `maojl.xyz` 和 `www.maojl.xyz`。
- Node.js 22 或更新的偶数版本。
- pnpm 11、Git、Nginx。
- 能使用 sudo 的部署账号。

安装基础软件：

```bash
sudo apt update
sudo apt install -y git nginx curl

curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs

sudo corepack enable
corepack prepare pnpm@11.11.0 --activate

node --version
pnpm --version
```

## 2. 获取项目

以下示例把项目放在 `/var/www/maojl`，把仓库地址替换为你的实际地址：

```bash
sudo mkdir -p /var/www/maojl
sudo chown -R "$USER":"$USER" /var/www/maojl

git clone <YOUR_GIT_REPOSITORY_URL> /var/www/maojl
cd /var/www/maojl
pnpm install --frozen-lockfile
```

不要把 Windows 上的 `node_modules` 或 `.output` 上传到 Linux。原生依赖必须
在目标服务器上安装和构建。

## 3. 配置生产环境变量

生成 OG 图片签名密钥：

```bash
openssl rand -hex 32
```

创建仅 root 和服务账号可读的环境文件：

```bash
sudo install -d -m 750 /etc/maojl
sudo nano /etc/maojl/maojl.env
```

写入：

```dotenv
NODE_ENV=production
HOST=127.0.0.1
PORT=3010
NUXT_SITE_URL=https://maojl.xyz
NUXT_SITE_INDEXABLE=true
NUXT_OG_IMAGE_SECRET=<刚才生成的64位十六进制密钥>
```

设置权限：

```bash
sudo chmod 640 /etc/maojl/maojl.env
sudo chown root:www-data /etc/maojl/maojl.env
```

`NUXT_SITE_URL` 和 `NUXT_SITE_INDEXABLE` 会影响预渲染页面、canonical、robots
和 sitemap，必须在执行构建命令之前加载。所有滚动部署实例必须使用同一个
`NUXT_OG_IMAGE_SECRET`。

## 4. 构建生产版本

```bash
cd /var/www/maojl
set -a
source /etc/maojl/maojl.env
set +a

pnpm typecheck
pnpm build
```

Nuxt 的生产入口会生成在：

```text
/var/www/maojl/.output/server/index.mjs
```

首次启动前可直接检查：

```bash
node .output/server/index.mjs
```

然后在另一个终端访问 `http://127.0.0.1:3010`。确认后按 Ctrl+C 停止，交给
systemd 管理。

## 5. 配置 systemd

创建 `/etc/systemd/system/maojl.service`：

```ini
[Unit]
Description=MAOJL.XYZ Nuxt server
After=network.target

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

让运行账号读取项目，然后启动服务：

```bash
sudo chown -R www-data:www-data /var/www/maojl
sudo systemctl daemon-reload
sudo systemctl enable --now maojl
sudo systemctl status maojl
sudo journalctl -u maojl -n 100 --no-pager
```

本机验证：

```bash
curl -I http://127.0.0.1:3010/
curl -I http://127.0.0.1:3010/robots.txt
curl -I http://127.0.0.1:3010/sitemap.xml
curl -I http://127.0.0.1:3010/rss.xml
```

## 6. 配置 Nginx

创建 `/etc/nginx/sites-available/maojl.xyz`：

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name maojl.xyz www.maojl.xyz;

    client_max_body_size 2m;

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

启用并检查配置：

```bash
sudo ln -s /etc/nginx/sites-available/maojl.xyz /etc/nginx/sites-enabled/maojl.xyz
sudo nginx -t
sudo systemctl reload nginx
```

此时先访问 `http://maojl.xyz`，确认 Nginx 能转发到 Nuxt。

## 7. 配置 HTTPS

使用 Certbot：

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d maojl.xyz -d www.maojl.xyz
sudo certbot renew --dry-run
```

Certbot 会配置证书和 HTTP 到 HTTPS 跳转。完成后检查：

```bash
curl -I https://maojl.xyz/
curl -I https://maojl.xyz/robots.txt
curl -I https://maojl.xyz/sitemap.xml
curl -I https://maojl.xyz/rss.xml
```

## 8. 上线验收

在项目目录运行生产冒烟测试：

```bash
cd /var/www/maojl
SMOKE_BASE_URL=https://maojl.xyz pnpm test:smoke
```

浏览器中继续确认：

- 首页、Blog、Notes、Releases、Archive 和 Search 可访问。
- 文章详情页与不存在的页面分别返回 200 和 404。
- `/robots.txt` 允许索引，且引用正确 sitemap。
- `/sitemap.xml` 中 URL 使用正式 HTTPS 域名。
- `/rss.xml` 中链接使用正式域名。
- 页面源码中的 canonical、Open Graph 图片和结构化数据使用正式域名。
- 手机宽度下导航没有溢出。

## 9. 日常更新

直接在当前目录更新：

```bash
cd /var/www/maojl
sudo -u www-data git pull --ff-only
sudo -u www-data pnpm install --frozen-lockfile

set -a
source /etc/maojl/maojl.env
set +a
sudo -E -u www-data pnpm typecheck
sudo -E -u www-data pnpm build

sudo systemctl restart maojl
sudo systemctl status maojl
SMOKE_BASE_URL=https://maojl.xyz pnpm test:smoke
```

更稳妥的生产方式是构建到带时间戳的 release 目录，通过 `current` 软链接切换；
这样构建失败不会覆盖正在运行的版本。

## 10. 回滚

如果使用普通 Git 工作目录，可以回退到已确认的提交并重新构建：

```bash
cd /var/www/maojl
git log --oneline -n 10
git switch --detach <KNOWN_GOOD_COMMIT>

set -a
source /etc/maojl/maojl.env
set +a
pnpm install --frozen-lockfile
pnpm build
sudo systemctl restart maojl
```

不要使用 `git reset --hard` 回滚服务器上的未知改动。推荐在部署前记录当前提交：

```bash
git rev-parse HEAD
```

## 11. 常用排障命令

```bash
# Nuxt 服务日志
sudo journalctl -u maojl -f

# Nginx 错误日志
sudo tail -f /var/log/nginx/error.log

# 端口监听
sudo ss -lntp | grep 3010

# 服务和反向代理检查
curl -I http://127.0.0.1:3010/
curl -I https://maojl.xyz/

# 配置检查
sudo nginx -t
sudo systemctl status maojl
```

常见问题：

- 页面可以打开但 canonical 仍是旧域名：构建前没有加载生产环境变量，重新构建。
- robots 禁止索引：确认 `NUXT_SITE_INDEXABLE=true` 并重新构建。
- OG 图片部署后间歇失效：所有实例没有使用相同的 `NUXT_OG_IMAGE_SECRET`。
- Nginx 返回 502：Nuxt 服务没有运行、端口不一致或 systemd 启动失败。
- 原生模块加载失败：不要跨操作系统复制 `node_modules`，在服务器重新安装依赖。

## 官方参考

- Nuxt Deployment: https://nuxt.com/docs/4.x/getting-started/deployment
- Nuxt Installation: https://nuxt.com/docs/4.x/getting-started/installation/
- Nginx Proxy Module: https://nginx.org/en/docs/http/ngx_http_proxy_module.html
