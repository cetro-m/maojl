---
title: Nginx 配置实战：反向代理、静态服务与性能调优
description: 从基础站点配置到生产环境调优，系统讲解 Nginx 作为反向代理、静态文件服务器、HTTPS 终结和负载均衡的典型用法。
date: 2024-09-06
category: engineering
tags:
  - nginx
  - devops
featured: false
draft: false
readingTime: 12 min read
---

## 背景

Nginx 是生产环境中最常见的反向代理和 Web 服务器。无论是给 Node.js 应用做流量入口、托管前端静态资源、还是做负载均衡和 SSL 终结，Nginx 几乎是一线部署的标配。

本文按使用场景分类，给出可复用的配置模板和参数说明。Nginx 配置的核心是理解指令的作用域——`http`、`server`、`location` 三个层级逐层继承和覆盖。

## 安装与基础验证

```bash
# Ubuntu / Debian
sudo apt update && sudo apt install nginx

# CentOS / RHEL
sudo yum install nginx

# macOS
brew install nginx

# 验证安装
nginx -v
nginx -t                   # 检查配置文件语法
```

## 配置文件结构

Nginx 的配置按功能拆分到 `conf.d/` 或 `sites-available/`，避免一个文件过长。

```
/etc/nginx/
├── nginx.conf             # 主配置
├── conf.d/
│   └── default.conf       # 通用站点配置
├── sites-available/       # Debian 风格：站点配置存放
│   └── example.com
├── sites-enabled/         # 启用站点的软链接
│   └── example.com -> ../sites-available/example.com
└── modules-enabled/       # 模块启用
```

### 最小可用配置

```nginx [nginx.conf]
events {
    worker_connections 1024;
}

http {
    include mime.types;
    default_type application/octet-stream;
    sendfile on;

    server {
        listen 80;
        server_name example.com;

        root /var/www/example.com;
        index index.html;

        location / {
            try_files $uri $uri/ /index.html;
        }
    }
}
```

## 反向代理（最常用场景）

将请求转发到后端应用，是 Nginx 最核心的用途。

```nginx [sites-available/api.example.com]
server {
    listen 80;
    server_name api.example.com;

    # 请求体大小限制（默认 1MB，API 通常需要调大）
    client_max_body_size 10m;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # WebSocket 支持
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";

        # 超时控制
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
```

### 代理关键指令说明

| 指令 | 作用 |
|------|------|
| `proxy_pass` | 后端地址，注意不带 `/` 和带 `/` 路径拼接规则不同 |
| `proxy_set_header Host $host` | 传递原始 Host，后端才能知道客户端请求的域名 |
| `proxy_set_header X-Real-IP $remote_addr` | 传递客户端真实 IP |
| `proxy_set_header X-Forwarded-For` | 传递整条代理链的 IP 列表 |
| `proxy_set_header X-Forwarded-Proto` | 传递请求协议（http/https） |

::callout{type="warning" title="proxy_pass 尾部斜杠陷阱"}
`proxy_pass http://backend` — 不传原始 URI 的匹配部分
`proxy_pass http://backend/` — 传原始 URI，会拼接替换

细节：
```nginx
location /api/ {
    proxy_pass http://backend/;
    # 请求 /api/users → http://backend/users
}
location /api/ {
    proxy_pass http://backend;
    # 请求 /api/users → http://backend/api/users
}
```
::

## 静态文件服务

前端 SPA 打包后的资源用 Nginx 直接托管，性能远优于通过 Node.js 静态中间件。

```nginx [sites-available/app.example.com]
server {
    listen 80;
    server_name app.example.com;

    root /var/www/app/dist;
    index index.html;

    # 静态资源缓存（带 hash 的文件名可长期缓存）
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # SPA 路由回退
    location / {
        try_files $uri $uri/ /index.html;
    }

    # 拒绝访问隐藏文件
    location ~ /\. {
        deny all;
    }
}
```

## HTTPS 与 TLS 配置

Certbot 配合 Let's Encrypt 是目前最推荐的证书管理方式。

```bash
# 安装 Certbot 并申请证书
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d example.com -d www.example.com

# 仅获取证书，手动配置
sudo certbot certonly --nginx -d example.com

# 证书自动续期（Certbot 默认已添加 systemd timer）
sudo certbot renew --dry-run
```

```nginx [sites-available/example.com-ssl]
server {
    listen 443 ssl http2;
    server_name example.com;

    ssl_certificate     /etc/letsencrypt/live/example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/example.com/privkey.pem;

    # 现代安全配置（2025+）
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;

    # HSTS
    add_header Strict-Transport-Security "max-age=63072000" always;

    # 会话缓存
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # OCSP Stapling
    ssl_stapling on;
    ssl_stapling_verify on;
    resolver 8.8.8.8 1.1.1.1 valid=300s;
    resolver_timeout 5s;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# HTTP → HTTPS 重定向
server {
    listen 80;
    server_name example.com;
    return 301 https://$host$request_uri;
}
```

## 负载均衡

将流量分发到多个后端实例，支持多种策略。

```nginx [sites-available/api.example.com]
upstream backend {
    # 默认轮询
    server 10.0.0.1:3000 weight=3;    # 权重 3，承担更多请求
    server 10.0.0.2:3000 weight=1;
    server 10.0.0.3:3000 backup;      # 备用节点，其余不可用时启用

    # 健康检查（需要 nginx-plus 或 ngx_http_upstream_check_module）
    # keepalive 连接池
    keepalive 64;
}

server {
    listen 80;
    server_name api.example.com;

    location / {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Connection "";
    }
}
```

### 负载均衡策略

```nginx
# 轮询（默认）— 按顺序分配
upstream backend {
    server 10.0.0.1:3000;
    server 10.0.0.2:3000;
}

# 最少连接 — 分配给当前活跃连接最少的节点
upstream backend {
    least_conn;
    server 10.0.0.1:3000;
    server 10.0.0.2:3000;
}

# IP Hash — 同一 IP 始终分配同一节点（适合会话保持）
upstream backend {
    ip_hash;
    server 10.0.0.1:3000;
    server 10.0.0.2:3000;
}
```

## 常见场景组合

### 前后端分离部署（同域名，按路径分流）

```nginx
server {
    listen 80;
    server_name example.com;

    root /var/www/app/dist;

    # 前端 SPA
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API 代理到后端
    location /api/ {
        proxy_pass http://127.0.0.1:3000/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # WebSocket
    location /ws/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

### 限制访问速率

```nginx
# 定义限速区域（共享内存，10MB 存储客户端状态）
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;

server {
    location /api/ {
        limit_req zone=api_limit burst=20 nodelay;
        proxy_pass http://backend;
    }
}
```

| 参数 | 说明 |
|------|------|
| `rate=10r/s` | 平均每秒最多 10 个请求 |
| `burst=20` | 允许瞬时突发 20 个请求排队 |
| `nodelay` | 突发请求不延迟处理，但超过 burst 的请求直接返回 503 |

### 屏蔽爬虫或恶意 IP

```nginx
# 屏蔽特定 User-Agent
if ($http_user_agent ~* (curl|wget|python-requests|Go-http-client)) {
    return 403;
}

# 屏蔽 IP 段
location /admin/ {
    allow 192.168.1.0/24;
    allow 10.0.0.0/8;
    deny all;
    proxy_pass http://backend;
}
```

## 性能调优

```nginx [nginx.conf]
# 工作进程数 = CPU 核心数
worker_processes auto;

events {
    # 每个 worker 的最大并发连接数
    worker_connections 4096;
    # 启用高效事件模型
    use epoll;
    # 一次接受多个新连接
    multi_accept on;
}

http {
    # 高效文件传输
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;

    # 连接复用
    keepalive_timeout 65;
    keepalive_requests 1000;

    # 缓冲区调优
    client_body_buffer_size 128k;
    client_max_body_size 10m;
    proxy_buffer_size 4k;
    proxy_buffers 8 16k;
    proxy_busy_buffers_size 32k;

    # Gzip 压缩
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 5;
    gzip_min_length 256;
    gzip_types
        text/plain
        text/css
        text/javascript
        application/javascript
        application/json
        application/xml
        image/svg+xml;

    # 静态文件缓存
    open_file_cache max=2000 inactive=20s;
    open_file_cache_valid 60s;
    open_file_cache_min_uses 2;
    open_file_cache_errors off;
}
```

## 日志与调试

```nginx
# 自定义日志格式
log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                '$status $body_bytes_sent "$http_referer" '
                '"$http_user_agent" "$http_x_forwarded_for" '
                'rt=$request_time uct=$upstream_connect_time '
                'uht=$upstream_header_time urt=$upstream_response_time';

access_log /var/log/nginx/access.log main;
error_log /var/log/nginx/error.log warn;

# 调试单个 location 的请求
server {
    location /api/ {
        access_log /var/log/nginx/api.log main;
        proxy_pass http://backend;
    }
}
```

### 快速排障

```bash
# 检查配置语法
nginx -t

# 重新加载配置（不停机）
nginx -s reload

# 查看活跃连接
curl http://127.0.0.1/nginx_status

# 查看访问日志中 5xx 响应
tail -f /var/log/nginx/access.log | grep 'HTTP/1.1" 5[0-9][0-9]'

# 测试代理是否正常工作
curl -H "Host: api.example.com" http://127.0.0.1/api/health
```

## 常见陷阱

### 1. Location 匹配优先级

```nginx
# 匹配顺序不是配置文件中的先后顺序，而是：
# = 精确匹配 > ^~ 前缀匹配 > ~* 正则匹配 > 普通前缀匹配

location = /exact { ... }        # 1. 完全匹配（最高优先级）
location ^~ /static/ { ... }    # 2. 前缀匹配，不检查正则
location ~ \.(jpg|png)$ { ... } # 3. 正则匹配（大小写敏感）
location ~* \.(jpg|png)$ { ... }# 4. 正则匹配（忽略大小写）
location /api/ { ... }           # 5. 普通前缀匹配
location / { ... }               # 6. 兜底
```

容易踩的坑：正则 location (`~`) 写在普通 location 前面时，会截走本应落到普通 location 的请求。

### 2. 代理后端返回 502

检查以下几个方向：

```bash
# 后端进程是否运行
curl http://127.0.0.1:3000/health

# nginx 能否连接到后端地址（不要只看 127.0.0.1 通不通）
ss -tlnp | grep 3000

# 是否有 SELinux 拦截（CentOS/RHEL 常见）
sudo setenforce 0    # 临时关闭测试
```

::callout{type="warning" title="注意"}
`setenforce 0` 会临时关闭 SELinux，降低系统安全级别。仅用于临时测试定位问题。生产环境应通过 `sudo setsebool -P httpd_can_network_connect 1` 永久解决，而不是保持 SELinux 关闭。
::

```bash
# 永久解决：sudo setsebool -P httpd_can_network_connect 1

# 检查 nginx error log
tail -20 /var/log/nginx/error.log
```

### 3. SSL 证书路径权限

`ssl_certificate_key` 文件的权限不能太开放，否则 nginx 启动会报 `permission denied`：

```bash
sudo chmod 400 /etc/letsencrypt/live/example.com/privkey.pem
sudo chown root:root /etc/letsencrypt/live/example.com/privkey.pem
```

### 4. X-Forwarded-For 未正确传递

如果后端获取不到真实客户端 IP，检查 `proxy_set_header` 是否齐全。后端框架通常还需要额外配置才能信任 Nginx 传递的头部：

```nginx
# Nginx 端
proxy_set_header X-Real-IP $remote_addr;
proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;

# 后端（以 Express 为例）
app.set('trust proxy', true);
# 或
app.set('trust proxy', 'loopback, 10.0.0.0/8');
```

## 总结

Nginx 配置可以按四个层次记忆：

1. **站点接入** — `server` 块定义域名、端口、SSL
2. **请求路由** — `location` 块按路径匹配分流到静态文件、代理或 API
3. **流量控制** — `upstream` 负载均衡 + `limit_req` 限流
4. **性能与安全** — Gzip、缓存、CORS、HSTS、SSL 配置

大多数生产项目只需要一个 HTTPS 反向代理配置 + 一个静态文件配置，直接复用本文中的模板替换域名和端口即可上线。如果需要调试某个请求，先打开对应 location 的独立 access log，配合 `nginx -t` + `nginx -s reload` 快速迭代验证。
