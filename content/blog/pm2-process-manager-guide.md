---
title: PM2 Node.js 进程管理方案
description: 从安装配置到生产部署，系统讲解 PM2 的进程管理、日志轮转、集群模式、优雅重启和监控告警，附带 ecosystem.config.js 完整模板。
date: 2026-04-16
category: engineering
tags:
  - nodejs
  - pm2
  - deployment
featured: false
draft: false
readingTime: 10 min read
---

## 背景

Node.js 应用部署到生产环境后，需要一个可靠的守护进程来处理崩溃重启、日志管理、多核负载和零停机更新。PM2 是目前最成熟的方案之一，内置了负载均衡、监控仪表盘和开机自启支持。

本文覆盖从单次启动到生产级配置的完整路径，大部分场景不需要安装其他工具。

## 安装与基础使用

```bash
# 全局安装
npm install -g pm2

# 验证版本
pm2 --version

# 启动一个 Node.js 应用
pm2 start app.js
pm2 start app.js --name my-api          # 指定进程名称
pm2 start app.js -i max                 # 以集群模式启动，使用所有 CPU 核心
pm2 start app.js -- --port=3001         # 向应用传递参数
```

::callout{type="terminal" title="Tip"}
PM2 默认在后台运行。首次启动后可以用 `pm2 save` 保存当前进程列表，配合 `pm2 startup` 实现服务器重启后自动恢复。
::

## 常用命令速查

```bash
# 进程管理
pm2 list              # 查看所有进程状态
pm2 show my-api       # 查看单个进程的详细信息
pm2 logs              # 实时查看所有日志
pm2 logs my-api       # 查看指定进程日志
pm2 monit            # 终端监控面板（CPU / 内存实时曲线）

# 生命周期
pm2 restart my-api    # 重启
pm2 reload my-api     # 零停机重载（集群模式）
pm2 stop my-api       # 停止
pm2 delete my-api     # 从 PM2 列表中移除

# 批量操作
pm2 restart all       # 重启所有进程
pm2 stop all          # 停止所有进程
pm2 delete all        # 清空所有进程
```

### 零停机重载 vs 重启

| 操作 | 行为 | 适用场景 |
|------|------|----------|
| `restart` | 杀死进程 → 启动新进程（有短暂停机） | 单实例、开发环境 |
| `reload` | 逐个 worker 重启，始终保持至少一个在线 | 生产环境集群模式 |
| `gracefulReload` | 等待现有请求处理完毕再重启 | 长连接、WebSocket |

### 日志管理

```bash
# 查看日志
pm2 logs --lines 200                     # 显示最近 200 行
pm2 logs my-api --err                    # 只看错误日志
pm2 flush                                # 清空所有日志

# 日志轮转（内置模块）
pm2 install pm2-logrotate

# 配置轮转参数
pm2 set pm2-logrotate:max_size 50M       # 单文件上限
pm2 set pm2-logrotate:retain 7           # 保留最近 7 个归档
pm2 set pm2-logrotate:compress true      # 归档后 gzip 压缩
```

## Ecosystem 配置文件

对于正式项目，应该使用 `ecosystem.config.js` 替代命令行参数。这个文件应该提交到版本库。

```js [ecosystem.config.js]
module.exports = {
  apps: [{
    name: 'api-server',
    script: 'dist/main.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
    },
    env_development: {
      NODE_ENV: 'development',
      PORT: 3001,
      watch: ['src'],
      watch_delay: 1000,
      ignore_watch: ['node_modules', 'dist', 'logs'],
    },
    // 错误处理
    max_restarts: 10,
    restart_delay: 5000,
    min_uptime: '30s',
    // 日志
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    // 优雅退出
    kill_timeout: 5000,
    listen_timeout: 3000,
    // 健康检查
    max_memory_restart: '500M',
  }],
}
```

启动时选择环境：

```bash
pm2 start ecosystem.config.js                  # 默认使用 env
pm2 start ecosystem.config.js --env development # 使用 env_development
```

## 集群模式详解

Node.js 是单线程的，一台服务器有多少个 CPU 核心，理论上应该启动多少个 worker 来充分利用硬件。

```js
instances: 'max',      // 自动检测 CPU 核心数
instances: 4,           // 手动指定数量
instances: 0,           // 与 max 相同
```

集群模式下 `reload` 的执行流程：

```
worker 1 ████████░░░░    ← 正在服务的连接
worker 2 ████████░░░░
worker 3 ████████░░░░
worker 4 ████████░░░░

pm2 reload api-server

worker 1 ████████░░░░   ← 正在关闭
worker 2 ░░░░░░░░░░░░   ← 已启动新版
worker 3 ████████░░░░   ← 正在关闭
worker 4 ░░░░░░░░░░░░   ← 已启动新版
```

这个过程逐个替换 worker，始终保持有 worker 在响应请求。

::callout{type="warning" title="注意"}
集群模式要求应用无状态。Session、Socket 连接等状态数据不能保存在进程内存中，必须使用 Redis 或数据库等外部存储。
::

## 开机自启

```bash
# 生成系统自启脚本
pm2 startup

# 保存当前进程列表（重启后自动恢复）
pm2 save

# 查看已保存的进程
pm2 resurrect
```

`pm2 startup` 会自动检测系统初始化系统（systemd / launchd / rc.d）并生成对应的脚本。

## 部署：搭配 Git 的远程部署

PM2 内置了 `deploy` 功能，支持从 Git 拉取代码并自动重启。

```js [ecosystem.config.js]
module.exports = {
  apps: [{
    name: 'api',
    script: 'dist/main.js',
  }],
  deploy: {
    production: {
      user: 'deploy',
      host: ['192.168.1.100'],
      ref: 'origin/main',
      repo: 'git@github.com:user/project.git',
      path: '/opt/app/api',
      'pre-deploy': 'git fetch --all',
      'post-deploy': 'pnpm install && pnpm build && pm2 reload ecosystem.config.js',
      'pre-setup': 'echo "Starting deployment..."',
    },
  },
}
```

```bash
# 首次部署
pm2 deploy production setup

# 后续更新
pm2 deploy production
```

## 监控与告警

```bash
# 终端监控面板
pm2 monit

# 基于 Keymetrics 的 Web 仪表盘（免费额度足够个人项目）
pm2 link <secret> <public-key>

# 自定义指标（在应用代码中）
const io = require('@pm2/io')
io.counter('requests/min').inc()
io.meter('req_rate').mark()
io.histogram('response_time').update(duration)
```

也可以直接通过 `pm2 describe` 和日志系统对接外部监控（Prometheus + Grafana 或自建告警脚本）。

## 常见问题

### 内存泄漏自动重启

```js
max_memory_restart: '500M',   // 达到 500MB 时自动重启
```

### 日志时间戳缺失

确保 `ecosystem.config.js` 中设置了 `log_date_format`，否则日志中只有原始文本没有时间。

### 端口占用

```bash
# 找出占用端口的进程
lsof -i :3000
# 或
ss -tlnp | grep 3000
kill -9 <PID>
```

### PM2 命令找不到

```bash
# 检查全局 node_modules 路径是否正确
npm root -g
# 如果指向非预期目录，设置 N_PREFIX 或重新安装 Node
```

### 重启频率过高保护

PM2 默认在短时间内反复崩溃时会自动停止尝试，避免进入 crash loop。通过 `max_restarts` 和 `restart_delay` 控制：

```js
max_restarts: 10,      // 30 秒内最多重启次数
restart_delay: 5000,   // 每次重启间隔 5 秒
```

## 总结

PM2 的核心配置可以归结为三点：

1. **进程守护** — `pm2 start` + `pm2 startup` + `pm2 save`，确保应用随系统启动并在崩溃后自动恢复
2. **集群模式** — `instances: 'max'` + `exec_mode: 'cluster'`，利用多核 CPU
3. **优雅运维** — 用 `ecosystem.config.js` 替代命令行，用 `reload` 替代 `restart`，用 `pm2-logrotate` 管理日志

推荐的新项目入口配置模板见上方的 `ecosystem.config.js`，大多数场景直接复制修改 `env` 环境变量和项目名称即可使用。
