---
title: 常用的 Linux 命令
description: Linux 命令，日常开发、部署和排查问题时，真正高频使用的。
date: 2026-07-09
category: engineering
draft: false
tags:
  - linux
  - command
  - server
  - devops
featured: false
readingTime: 4 min read
---

## 常用比全面更重要

Linux 命令很多，完整命令手册适合临时查询，但日常真正高频使用的其实就那么一批。

对我来说，常用命令主要解决几件事：

- 我现在在哪
- 文件和配置在哪里
- 服务有没有跑
- 端口有没有监听
- 日志报了什么
- 磁盘和内存是否正常

这篇不是命令大全，只是我自己的 Linux 常用工具箱。

::callout{type="note" title="习惯"}
命令不用一次背完，先记住高频场景，再慢慢补参数。
::

## 文件和目录

```bash
pwd
ls -la
cd /var/www/site
cd ..
mkdir -p backups
cp -r web web-backup
mv old.txt new.txt
rm -rf old-folder
````

`pwd` 和 `ls -la` 是我在服务器上最常敲的两条命令。
尤其是删除、移动、拉代码之前，先确认自己在哪个目录，比什么都重要。

线上服务器执行 `rm -rf` 前，先 `pwd`，再 `ls -la`。路径错了就是真的没了。
::

## 查看文件和日志

```bash
cat nginx.conf
less access.log
head -n 20 access.log
tail -n 100 -f error.log
```

小文件用 `cat`，大文件用 `less`。
看日志最常用的还是 `tail -f`，项目启动失败、Nginx 报错、接口异常，基本都要靠它定位。

```bash
tail -n 100 -f /var/log/nginx/error.log
tail -n 100 -f /var/log/nginx/access.log
pm2 logs
```

## 搜索内容

```bash
grep -rn "proxy_pass" /etc/nginx
grep -rn "server_name" /etc/nginx
grep -rn "关键词" .
grep -i "error" app.log
```

很多问题不是不知道怎么改，而是不知道配置写在哪里。
不确定的时候，先 `grep`。

```bash
grep -rn "关键词" .
```

::

## 查找文件

```bash
find . -name "*.log"
find /var/www/site -name "package.json"
find . -type d -name "node_modules"
find . -type f -size +100M
find . -type f -mtime -7
```

`find` 适合找文件、目录、大文件和最近修改过的文件。
磁盘空间异常时，找大文件尤其有用。

## 进程和端口

```bash
ps aux | grep node
ps aux | grep nginx
kill 12345
kill -9 12345
```

看服务有没有跑，先查进程。
但不要看到 `node` 就直接杀，服务器上可能有多个 Node 项目。

```bash
ss -tulpn
ss -tulpn | grep 3000
ss -tulpn | grep 1337
ss -tulpn | grep :80
lsof -i :3000
```

端口排查是部署时的高频动作。
比如 Nuxt 在 3000，Strapi 在 1337，Nginx 在 80/443，只要有一个端口不对，访问就会出问题。

## 磁盘和内存

```bash
df -h
du -sh *
du -h --max-depth=1 /var/www
free -h
top
uptime
```

服务器异常时，不要只盯着代码。
磁盘满了、内存不够、负载过高，都会让项目表现得像“代码坏了”。

我常用的排查顺序：

```bash
df -h
cd /var/www
du -h --max-depth=1
free -h
top
```

## 网络测试

```bash
curl -I https://example.com
curl -I http://localhost:3000
curl -I http://localhost:1337
curl -A "Googlebot" -I https://example.com
ping example.com
nslookup example.com
```

`curl -I` 很适合分层排查。

如果 `localhost:3000` 正常，但域名不正常，问题可能在 Nginx、CDN、DNS 或证书。
如果本地端口都不正常，那就先看应用本身。

## Nginx

```bash
nginx -t
nginx -T
systemctl reload nginx
systemctl restart nginx
systemctl status nginx
tail -n 100 -f /var/log/nginx/error.log
```

改完 Nginx 配置后，我固定会先跑：

```bash
nginx -t
systemctl reload nginx
systemctl status nginx
```

`nginx -T` 适合确认当前实际加载了哪些配置。

## PM2

```bash
pm2 list
pm2 logs
pm2 logs nuxt
pm2 restart nuxt
pm2 stop nuxt
pm2 delete nuxt
pm2 save
pm2 startup
```

Node 项目部署到服务器后，用 PM2 管理会省心很多。
看状态、看日志、重启服务，基本都靠它。

## Git

```bash
git status
git branch -vv
git log --oneline -5
git pull
git reset --hard origin/main
```

服务器上更新代码前，我会先看 `git status`。
如果部署目录不应该有本地修改，状态干净再 `git pull` 最稳。

`git reset --hard` 会丢弃本地修改，只适合确认服务器代码可以完全跟远程同步时使用。
::

## 权限和服务

```bash
whoami
id
ls -l
chmod +x deploy.sh
chmod 644 file.txt
chmod 755 folder
chown -R www-data:www-data /var/www/site
```

权限问题经常伪装成程序问题。
文件读不了、脚本不能执行、上传失败，都可能和权限有关。

```bash
systemctl status nginx
systemctl restart nginx
systemctl enable nginx
journalctl -u nginx -n 100
journalctl -u nginx -f
```

系统服务出问题时，`systemctl status` 和 `journalctl` 通常能看到原因。

## 我的快速排查清单

网站访问异常时，我一般先敲这些：

```bash
pm2 list
systemctl status nginx
ss -tulpn
curl -I http://localhost:3000
curl -I http://localhost:1337
nginx -t
tail -n 100 -f /var/log/nginx/error.log
df -h
free -h
```

基本可以判断问题在哪一层：

* 应用没启动
* 端口没监听
* Nginx 配置错误
* 反向代理不对
* 磁盘满了
* 内存不够
* DNS / CDN 层异常

## 最后

如果只保留一小部分，我会留下这些：

```bash
pwd
ls -la
tail -f
grep -rn
find
ps aux
ss -tulpn
lsof -i
df -h
du -sh
free -h
top
curl -I
nslookup
nginx -t
nginx -T
systemctl status
journalctl -u
pm2 list
pm2 logs
git status
git pull
```

命令本身不复杂，重要的是形成排查顺序。
先确认路径，再确认进程和端口，再看日志和配置，最后看系统资源。
