## 每次发布文章

### 1. 本地创建文章

Blog 文章放在：

```text
content/blog/
```

例如：

```text
content/blog/my-new-article.md
```

基础 frontmatter：

```yaml
---
title: 文章标题
description: 用于列表和 SEO 的简短描述。
date: 2026-07-12
category: engineering
draft: false
featured: false
tags:
  - nuxt
  - development
readingTime: 8 min read
---
```

写作期间可以先设置：

```yaml
draft: true
```

准备发布时改为：

```yaml
draft: false
```

短笔记放在 `content/notes/`，发布流程相同。

### 2. 本地预览

```powershell
pnpm dev
```

检查：

```text
http://127.0.0.1:3010/blog
http://127.0.0.1:3010/blog/my-new-article
```

重点确认：

- 标题、日期、分类和标签正确
- 目录锚点正常
- 代码块正常
- 移动端没有横向溢出
- `draft: false`
- 文件名适合作为永久 URL，不要发布后频繁更改

### 3. 本地验证

```powershell
pnpm typecheck
pnpm build
```

也可以一次完成：

```powershell
pnpm validate
```

### 4. 提交并推送

只提交文章：

```powershell
git status
git add content/blog/my-new-article.md
git commit -m "content: publish my new article"
git push origin master
```

如果发布 Notes：

```powershell
git add content/notes/my-new-note.md
```

### 5. 服务器拉取

```bash
ssh root@47.99.215.193
cd /var/www/maojl
sudo -u maojl git status --short
sudo -u maojl git -c http.version=HTTP/1.1 pull --ff-only
```

`git status --short` 必须无输出。文章更新没有修改依赖时，不需要执行 `pnpm install`。

### 6. 生产构建

加载生产环境：

```bash
set -a
source /etc/maojl/maojl.env
set +a
```

构建：

```bash
sudo -E -u maojl env \
  HOME=/var/www/maojl \
  XDG_CONFIG_HOME=/var/cache/maojl/config \
  XDG_DATA_HOME=/var/cache/maojl/data \
  XDG_STATE_HOME=/var/cache/maojl/state \
  COREPACK_HOME=/var/cache/maojl/corepack \
  NUXT_TELEMETRY_DISABLED=1 \
  corepack pnpm@11.11.0 deploy:build
```

必须看到：

```text
✨ Build complete!
```

### 7. 重启服务

```bash
systemctl restart maojl
systemctl status maojl --no-pager
```

预期：

```text
Active: active (running)
Listening on http://127.0.0.1:3010
```

### 8. 验证新文章

```bash
curl -I https://maojl.xyz/blog/my-new-article
```

应返回 200。

再运行完整冒烟测试：

```bash
sudo -u maojl env \
  HOME=/var/www/maojl \
  XDG_CONFIG_HOME=/var/cache/maojl/config \
  XDG_DATA_HOME=/var/cache/maojl/data \
  XDG_STATE_HOME=/var/cache/maojl/state \
  COREPACK_HOME=/var/cache/maojl/corepack \
  SMOKE_BASE_URL=https://maojl.xyz \
  corepack pnpm@11.11.0 test:smoke
```

最后检查日志：

```bash
journalctl -u maojl --since "10 minutes ago" --no-pager -p warning
```

简化记忆就是：

```text
本地写文章 → pnpm validate → commit/push
服务器 pull → deploy:build → restart → curl + smoke
```