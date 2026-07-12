# MAOJL.XYZ 部署指南

本文档基于 2026-07-12 15:09（Asia/Shanghai）对目标主机 `47.99.215.193` 的只读复核。复核期间未修改文件、服务、进程或网络配置。

## 服务器现状

| 项目 | 已确认状态 |
| --- | --- |
| 系统 | Ubuntu 22.04.5 LTS（x86_64） |
| Node.js | v24.15.0，路径 `/usr/bin/node` |
| pnpm | 10.33.0，路径 `/usr/bin/pnpm` |
| Nginx | 1.18.0，监听 80/443 |
| 现有应用 | Bioer Node 服务监听 `127.0.0.1:3000`，保持不变 |
| MAOJL 服务 | `maojl.service` 已启用并运行，监听 `127.0.0.1:3010` |
| MAOJL 目录 | `/var/www/maojl`，属主 `maojl:maojl`，权限 0755 |
| MAOJL 版本 | `master` / `ca77da97aeb3a80e9c1b1ca6b87509783031cae9`，工作区干净 |
| 域名与 HTTPS | `maojl.xyz` 解析至本机；HTTP 301 到 HTTPS；主页及 SEO/RSS 端点均返回 200 |
| TLS 证书 | Let's Encrypt，仅包含 `maojl.xyz`，有效至 2026-10-10；`certbot.timer` 已启用 |
| 资源 | 7.2 GiB 内存、无 Swap；根分区 99 GiB，已用 21% |

现有 Bioer 应用是独立生产系统。部署 MAOJL 时不得复用或覆盖其目录、3000 端口、systemd 单元和 Nginx 配置。

## 进程管理决策

MAOJL 固定使用独立的 `maojl.service`，不加入服务器现有的 root PM2 实例。

服务器上的 PM2 当前负责 Bioer Web、CMS 和日志轮转。将 MAOJL 加入同一 PM2 实例会扩大 `pm2 restart all`、`pm2 delete all`、`pm2 kill` 和 `pm2 save` 等命令的影响范围，也会让 MAOJL 继承 root 权限并与 Bioer 共用环境变量和日志目录。

systemd 方案保持以下隔离边界：

- MAOJL 以专用的 `maojl` 系统用户运行，不使用 root PM2 daemon，也不与 Nginx Worker 共用 `www-data` 身份。
- 直接执行 `/usr/bin/node .output/server/index.mjs`，运行阶段不依赖 pnpm。
- 环境变量只从 `/etc/maojl/maojl.env` 加载。
- 日志由 journald 单独记录在 `maojl.service` 下。
- 启停 MAOJL 不调用任何 `pm2` 命令，不影响 Bioer 进程清单。

不要为 MAOJL 执行 `pm2 start`、`pm2 save` 或 `pm2 startup`。

## 当前结构

```text
Internet -> Nginx :80/:443 -> MAOJL Nitro 127.0.0.1:3010
                              systemd: maojl.service
                              files: /var/www/maojl

                            -> existing Bioer app 127.0.0.1:3000 (保持不变)
```

项目要求 Node.js >=22 和 pnpm >=11。服务器 Node 版本满足要求，但系统级 pnpm 10.33.0 不满足项目约束。线上部署通过 Corepack 显式调用项目固定的 pnpm 11.11.0；不要替换系统级 pnpm，以免影响现有应用。

使用 Corepack 显式调用项目固定版本，不要执行全局 `--activate`，以免改变现有 Bioer 应用使用的 pnpm：

```bash
corepack pnpm@11.11.0 --version
```

## 当前运维边界

1. 只维护 `maojl.xyz`。当前 `www.maojl.xyz` 未解析且不在证书 SAN 中，不能在 Nginx 中直接启用；如需支持，必须先完成 DNS，再扩展证书。
2. 80/443 由 Nginx 对公网提供，3010 仅绑定 `127.0.0.1`，不得在安全组或防火墙中开放。
3. MAOJL 仅使用 `/var/www/maojl`、`/etc/maojl`、`/var/cache/maojl`、`maojl.service` 和独立的 `maojl.xyz` Nginx 站点。
4. 任何更新前先记录提交、确认工作区干净，并检查 Nginx、服务和 3000/3010 端口状态。

只读复核命令：

```bash
getent hosts maojl.xyz
ss -lntp | grep -E ':(80|443|3000|3010) '
systemctl status nginx --no-pager
systemctl status maojl --no-pager
systemctl cat maojl
systemd-analyze security maojl --no-pager
nginx -t
```

## 首次部署

以下命令会修改服务器，只能在明确批准的维护窗口执行。

仓库中的 `deployment/maojl.env.example`、`deployment/maojl.service`、
`deployment/maojl-hardening.conf` 和 `deployment/nginx-maojl.conf` 是线上配置的可版本化模板。部署时先复制到目标位置，
再填写真实密钥和按主机情况复核；不要直接在模板中保存生产密钥。

```bash
useradd --system --home-dir /var/www/maojl --shell /usr/sbin/nologin --user-group maojl
install -d -o maojl -g maojl -m 755 /var/www/maojl
install -d -o maojl -g maojl -m 755 /var/cache/maojl/corepack
install -d -o maojl -g maojl -m 755 /var/cache/maojl/config /var/cache/maojl/data /var/cache/maojl/state
sudo -u maojl git clone https://github.com/cetro-m/maojl.git /var/www/maojl
cd /var/www/maojl
sudo -u maojl env \
  HOME=/var/www/maojl \
  XDG_CONFIG_HOME=/var/cache/maojl/config \
  XDG_DATA_HOME=/var/cache/maojl/data \
  XDG_STATE_HOME=/var/cache/maojl/state \
  COREPACK_HOME=/var/cache/maojl/corepack \
  corepack pnpm@11.11.0 install --frozen-lockfile
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

建议权限：目录 `root:maojl 0750`，环境文件 `root:maojl 0640`。密钥可以用 `openssl rand -hex 32` 生成，禁止提交到 Git。

构建时必须先加载生产环境变量，因为站点 URL 和可索引状态会进入预渲染输出：

```bash
cd /var/www/maojl
set -a
source /etc/maojl/maojl.env
set +a
sudo -E -u maojl env \
  HOME=/var/www/maojl \
  XDG_CONFIG_HOME=/var/cache/maojl/config \
  XDG_DATA_HOME=/var/cache/maojl/data \
  XDG_STATE_HOME=/var/cache/maojl/state \
  COREPACK_HOME=/var/cache/maojl/corepack \
  corepack pnpm@11.11.0 deploy:build
```

## systemd 单元

线上使用基础 unit 与安全加固 drop-in：

- `/etc/systemd/system/maojl.service` 对应 `deployment/maojl.service`。
- `/etc/systemd/system/maojl.service.d/hardening.conf` 对应 `deployment/maojl-hardening.conf`。
- 当前 `systemd-analyze security maojl` 暴露评分为 2.8（OK）。

安装模板：

```bash
install -o root -g root -m 0644 deployment/maojl.service /etc/systemd/system/maojl.service
install -d -o root -g root -m 0755 /etc/systemd/system/maojl.service.d
install -o root -g root -m 0644 deployment/maojl-hardening.conf \
  /etc/systemd/system/maojl.service.d/hardening.conf
```

首次启用前先确认 `ExecStart`、工作目录、用户和 3010 端口均正确，再执行 `daemon-reload` 和启动操作。

```bash
systemctl daemon-reload
systemctl enable --now maojl
systemctl status maojl --no-pager
journalctl -u maojl -n 100 --no-pager
```

日常只操作 MAOJL 自己的服务单元：

```bash
systemctl restart maojl
systemctl stop maojl
systemctl start maojl
journalctl -u maojl -f
```

## Nginx 独立站点

线上独立文件为 `/etc/nginx/sites-available/maojl.xyz`，并通过
`/etc/nginx/sites-enabled/maojl.xyz` 符号链接启用。不要编辑或复用现有 Bioer 站点块。

```bash
install -o root -g root -m 0644 deployment/nginx-maojl.conf /etc/nginx/sites-available/maojl.xyz
ln -s /etc/nginx/sites-available/maojl.xyz /etc/nginx/sites-enabled/maojl.xyz
nginx -t
```

模板是当前签证后的最终 HTTPS 形态，依赖 `/etc/letsencrypt/live/maojl.xyz`。全新主机首次签证时应先用仅含 80 端口的临时站点完成 ACME 验证，再安装最终模板。每次改动前后都运行 `nginx -t`；不得改动 Bioer 证书或站点。

## 验收

先验证应用回环地址，再验证域名：

```bash
curl -I http://127.0.0.1:3010/
curl -I https://maojl.xyz/
curl -I https://maojl.xyz/robots.txt
curl -I https://maojl.xyz/sitemap.xml
curl -I https://maojl.xyz/rss.xml

cd /var/www/maojl
sudo -u maojl env HOME=/var/www/maojl \
  XDG_CONFIG_HOME=/var/cache/maojl/config \
  XDG_DATA_HOME=/var/cache/maojl/data \
  XDG_STATE_HOME=/var/cache/maojl/state \
  COREPACK_HOME=/var/cache/maojl/corepack \
  SMOKE_BASE_URL=https://maojl.xyz corepack pnpm@11.11.0 test:smoke
```

同时确认：canonical、Open Graph、sitemap 和 RSS 均使用正式 HTTPS 域名；不存在页面返回 404；现有 Bioer 域名和 3000 端口服务不受影响。

## 更新与回滚

更新前记录当前提交，并先在独立目录构建。最稳妥的方式是使用带时间戳的 release 目录和 `current` 软链接原子切换，避免覆盖正在运行的 `.output`。

若仍采用单工作目录，至少执行：

```bash
cd /var/www/maojl
sudo -u maojl git status --short
sudo -u maojl git rev-parse HEAD
sudo -u maojl git pull --ff-only
sudo -u maojl env HOME=/var/www/maojl \
  XDG_CONFIG_HOME=/var/cache/maojl/config \
  XDG_DATA_HOME=/var/cache/maojl/data \
  XDG_STATE_HOME=/var/cache/maojl/state \
  COREPACK_HOME=/var/cache/maojl/corepack \
  corepack pnpm@11.11.0 install --frozen-lockfile
set -a
source /etc/maojl/maojl.env
set +a
sudo -E -u maojl env HOME=/var/www/maojl \
  XDG_CONFIG_HOME=/var/cache/maojl/config \
  XDG_DATA_HOME=/var/cache/maojl/data \
  XDG_STATE_HOME=/var/cache/maojl/state \
  COREPACK_HOME=/var/cache/maojl/corepack \
  corepack pnpm@11.11.0 deploy:build
systemctl restart maojl
systemctl status maojl --no-pager
sudo -u maojl env HOME=/var/www/maojl \
  XDG_CONFIG_HOME=/var/cache/maojl/config \
  XDG_DATA_HOME=/var/cache/maojl/data \
  XDG_STATE_HOME=/var/cache/maojl/state \
  COREPACK_HOME=/var/cache/maojl/corepack \
  SMOKE_BASE_URL=https://maojl.xyz corepack pnpm@11.11.0 test:smoke
```

不要使用 `git reset --hard` 清除服务器上的未知改动。回滚应切换到已记录的已知良好提交或 release 目录，重新启动 `maojl`，再执行冒烟测试。

## 常用只读排查

```bash
systemctl status maojl --no-pager
journalctl -u maojl -n 100 --no-pager
ss -lntp | grep 3010
curl -I http://127.0.0.1:3010/
curl -I https://maojl.xyz/
tail -n 100 /var/log/nginx/error.log
nginx -t
systemctl status certbot.timer --no-pager
openssl x509 -in /etc/letsencrypt/live/maojl.xyz/fullchain.pem -noout -dates -ext subjectAltName
```

任何变更操作都应限定在 `/var/www/maojl`、`maojl.service` 和 MAOJL 自己的 Nginx 站点文件内。
