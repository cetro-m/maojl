---
title: Grok 注册机
description: Grok Auto Register 项目的架构拆解、浏览器控制、临时邮箱集成、并发注册、token 入池。
date: 2026-07-12
category: engineering
tags:
  - python
  - automation
  - grok
  - drissionpage
featured: false
draft: false
readingTime: 7 min read
---

## 核心架构

项目分四层：

```text
CLI / GUI 入口层
   │
   调度层（并发控制、重试、速度统计）
   │
   业务层（注册流程、CPA 导出）
   │
   基础设施层（浏览器管理、临时邮箱、HTTP 请求、token 入池）
```

主程序 `grok_register_ttk.py`（~160KB）同时承载 GUI（tkinter）和 CLI 入口。浏览器控制用 DrissionPage（DevTools Protocol），HTTP 请求用 curl_cffi。

## 浏览器控制引擎

用 **DrissionPage**（v4.1.1.4）替代 Selenium，API 更轻量：

```python
from DrissionPage import Chromium, ChromiumOptions

def create_browser_options():
    co = ChromiumOptions()
    co.set_argument('--no-sandbox')
    co.set_argument('--disable-gpu')
    co.set_user_agent(user_agent)
    return co
```

每个 worker 用**独立的 Chromium 实例和 user-data 目录**，单账号完成后完整重启浏览器，避免 session 残留。

## 临时邮箱

支持 DuckMail、YYDS、Cloudflare 三种。Cloudflare 最常用，基于 `dreamhunter2333/cloudflare_temp_email`：

```python
def cloudflare_create_temp_address(api_base):
    resp = http_post(f"{api_base}/api/new_address")
    data = resp.json()
    return data['address'], data['jwt_token']
```

两种鉴权模式：

| 模式 | 创建 API | 鉴权 | 适用 |
|------|---------|------|------|
| `none` | `/api/new_address` | 无 | 默认 |
| `x-admin-auth` | `/admin/new_address` | ADMIN_PASSWORD | Turnstile 保护时 |

验证码轮询 `/api/mails` 接口，超时则换邮箱重试。

## 并发注册

`concurrent_count` 控制并行 worker 数，各自独立的浏览器实例：

```json
{ "register_count": 20, "concurrent_count": 3 }
```

`RateMeter` 每 60s 输出速率：

```python
class RateMeter:
    def format_line(self, success, fail=0, force=False):
        elapsed = time.time() - self.window_start
        rate = success / (elapsed / 60) if elapsed > 0 else 0
        return f"{success}/{fail}，{rate:.1f}/min"
```

## CPA 凭证导出与 Token 入池

注册后异步导出 CPA xAI OIDC 凭证（独立浏览器，不占用注册 tab）。SSO token 写入三个目标：本地 accounts 文件、本地 grok2api 池、远端 grok2api REST API。

```python
def add_token_to_grok2api_remote_pool(raw_token, email="", log_callback=None):
    bases = get_grok2api_remote_api_bases(config.grok2api_remote_base)
    for base in bases:
        url = base.rstrip('/') + '/tokens/add'
        resp = http_post(url, json={
            'token': normalized_token, 'email': email,
            'app_key': config.grok2api_remote_app_key,
        })
```

## 配置示例

最小注册（Cloudflare 匿名邮箱）：

```json
{
  "email_provider": "cloudflare",
  "cloudflare_api_base": "https://你的-worker域名",
  "register_count": 5,
  "concurrent_count": 1
}
```

批量 + 远程入池：

```json
{
  "register_count": 50,
  "concurrent_count": 5,
  "grok2api_auto_add_remote": true,
  "grok2api_remote_base": "https://你的-grok2api-域名",
  "grok2api_remote_app_key": "your_app_key",
  "log_level": "info"
}
```

## 稳定性设计

- 每账号完整重启浏览器，独立 user-data 目录
- CF 拦截页检测与重试
- 验证码超时自动换邮箱
- 每 5 个账号调用 `gc.collect()`
- `Ctrl+C` 首次收尾，连按两次强制退出

```python
def sleep_with_cancel(seconds, cancel_callback=None):
    for _ in range(int(seconds)):
        if cancel_callback and cancel_callback():
            raise RegistrationCancelled()
        time.sleep(1)
```

## 注意事项

::callout{type="warning" title="合规"}
自动化注册工具仅用于学习研究。使用前阅读目标网站服务条款。
::

- Python 3.10+，创建虚拟环境运行
- 所有操作依赖真实浏览器，CLI 模式同样会打开窗口
- 需自行部署 Cloudflare Worker 临时邮箱服务
- `concurrent_count` 过高消耗大量系统资源

项目地址：[github.com/maxucheng0/grok-auto-register](https://github.com/maxucheng0/grok-auto-register)
