---
title: AI 中转站
description: AI API 中转站的定价体系、模型倍率机制、隐蔽成本、避坑方法和选型框架。
date: 2026-06-20
category: engineering
tags:
  - ai
  - api
  - pricing
featured: false
draft: false
readingTime: 8 min read
---

## 背景

OpenAI / Anthropic / Google 的大模型 API 在中国大陆无法直接访问。AI 中转站购买官方额度、架设反向代理，以统一接口转售给国内用户。问题在于价格极不透明——同样模型报价差 3-5 倍是常事。

中转站底层通常是 OneAPI 或 NewAPI，做三件事：协议转换（非 OpenAI 协议转兼容格式）、计费扣减（按倍率算额度）、路由分发（多后端负载均衡）。

## 模型倍率

倍率系统的来源：OneAPI 把所有模型价格与基准模型 `davinci-002`（$0.002/1K tokens）对齐。但这个基准的绝对价格没意义，问题在于中转站可以**任意调整倍率**。

从官方定价到用户实际支付，每个环节都能掺水：

| 环节 | 可操作空间 |
|------|-----------|
| 模型倍率 | 任意设定，与官方无关 |
| 额度汇率 | 1 元 = 5000~20000 不等 |
| 最低消费 | 每笔最低扣费 |
| 四舍五入 | 向上取整 |

### 算绝对倍率

```python
def real_cost(cny_per_million, usd_per_million, rate=7.3):
    """绝对倍率 = 中转站价格 ÷ 官方价格"""
    return cny_per_million / (usd_per_million * rate)
```

例：某站 Claude Sonnet 4.6 输入收 8 元/M token，官方 $3/M × 7.3 = 21.9 元。绝对倍率 8/21.9 = 0.37——官方价的 37%。

## 常见坑

### 1. 冒牌模型

中转站在 NewAPI 后台改个模型别名，就能用低成本模型冒充高价模型。检测方法：

```python
import openai
client = openai.OpenAI(api_key="key", base_url="https://中转站/v1")
resp = client.chat.completions.create(
    model="claude-sonnet-4.6",
    messages=[{"role": "user", "content": "你是谁？"}]
)
print(resp.model)  # 看实际返回什么模型名
```

### 2. 隐蔽成本

- **最低消费**：每次请求最低扣 1000 额度，短请求实际翻倍
- **额度双重汇率**：充值和消耗用不同汇率
- **预充值不退**：一旦跑路钱打水漂（2026 年已有多起刑拘案例）

## 怎么选

靠谱中转站的特征：

- 明码标价，公示每百万 token 价格
- 主要渠道来自官方 API，不是多层嵌套代理
- 有工单或用户群
- 支持按量计费，不强制高额预付
- 有公开接入文档

辅助工具：

- [API Ranking](https://apiranking.com/) — 实时比价 + 真假检测
- [最全 API 导航](https://www.zuiquanapi.com/) — 1000+ 中转站收录
- [One Tracker](https://ot.nekro.ai/) — 价格追踪

## 自建中转

```yaml
services:
  newapi:
    image: calciumion/new-api:latest
    ports: ["3000:3000"]
    volumes: [./data:/data]
    restart: always
```

自建完全掌控渠道，数据不经过第三方。需要一台境外服务器，仍需购买官方 API 额度。

::callout{type="warning" title="提醒"}
先充 10-20 元试模型质量和余额消耗速度，满意再续。不要一次性大量充值。
::

参考：https://linux.do/t/topic/2504277
