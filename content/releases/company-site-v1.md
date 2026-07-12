---
title: 企业官网正式上线
description: 基于 Strapi v5 + Nuxt 4 的双语企业官网正式发布。涵盖 CMS 内容架构、Admin 后台定制、前端站点页面、认证文件网关、缓存策略与安全加固，完整内容到发布流水线就绪。
version: v1.0.0
date: 2026-07-01
latest: true
prerelease: false
draft: false
assets: []
---

## 概览

企业官网是一个双仓库项目——Strapi v5 CMS 负责内容管理，Nuxt 4 前端负责公开站点渲染。经过三个月迭代，完整的内容到发布流水线已就绪：编辑人员在双语 Admin 后台管理产品、新闻和资源，前端在两个本地化域名下渲染展示，并集成了认证、搜索和文件门控交付。

架构示意：

```text
用户浏览器
  |
  v
Nginx 80/443
  |-- www.example.com / en.example.com  -> Nuxt Node 127.0.0.1:3000
  |-- cms.example.com                    -> Strapi     127.0.0.1:1337
```

## CMS — Strapi 后端

**内容架构**

十二个 Collection Type 构成内容骨架：产品带多级分类树，新闻带分类和 Banner，资源带分类文件库，首页和关于页 Banner，联系页面，以及通过生命周期钩子发送邮件通知的联系表单收件箱。

后续迭代补充了内容组（Content Group）描述字段和翻译键管理。编辑人员可以指定内容所属分组，前端据此渲染不同页面布局；多语言字段空值时显示翻译占位符而非空白。

**自研插件**

两个自研插件扩展了 Strapi Content Manager：

- **树状分类筛选器** — 编辑者无需离开列表页，即可按分层分类树筛选产品、文章和资源列表
- **拖拽分类排序器** — 在分类树中持久化自定义排序，排序结果直接用于前端侧边栏展示

第三方插件提供了上传时自动生成 WebP 响应式图片、CKEditor 5 富文本编辑器、以及带生命周期钩子和可选定时清理的软删除。

```ts [config/plugins.ts]
// 图片响应式配置 — 三个尺寸 + WebP/JPEG/PNG
breakpoints: {
  xlarge: { breakpoint: 1566, formats: ['webp', 'jpeg', 'png'] },
  large:  { breakpoint: 1280, formats: ['webp', 'jpeg', 'png'] },
  medium: { breakpoint: 768,  formats: ['webp', 'jpeg', 'png'] },
  small:  { breakpoint: 640,  formats: ['webp', 'jpeg', 'png'] },
},
```

**Admin 后台定制**

管理界面完成了全套品牌化改造：自定义公司 Logo、Favicon，以及贯穿按钮、链接、边框和底色的一套蓝色主色调系统。

完整的国际化覆盖英文和简体中文：

- 所有 Admin 界面文本通过自定义 locale 文件翻译
- Content Manager 列表页和编辑页中的硬编码英文字符串在运行时替换为中文
- 内容模型的字段标签根据所选 Admin 语言显示
- 全局搜索框的占位符跟随当前语言
- 翻译缺失收集器可在调试模式下运行，帮助发现未翻译的 key

Content Manager 导航按业务域分组（产品、新闻、页面、系统），顺序统一在 `src/admin/app.ts` 中管理，添加新内容类型只需修改一处配置。文档标题根据当前路由动态更新，DOM 观察器确保 Vite/HMR 热更新后标题替换、按钮标签、导航分组标签依然正确。产品与文章的编辑页面增加了"前端查看"按钮，编辑者可一键在新标签页打开对应的线上页面。

**前端页面入口配置**

CMS Admin 新增了 Frontpage 管理能力，允许编辑人员在不修改代码的情况下切换首页展示的产品组和新闻组，通过 Strapi API 实时同步到前端。

## Web — Nuxt 前端

**技术栈**

基于 Nuxt 4、Nuxt UI 4、Tailwind CSS 4、daisyUI 5 和 `@nuxtjs/i18n` 构建。自托管 Inter 字体，WOFF2 格式覆盖 400–900 字重。中英文支持基于域名切换（`en.example.com` / `www.example.com`）或同域名前缀模式（`/zh`）。

**公共页面**

| 页面 | 功能 |
|------|------|
| 首页 | 公司着陆页，Banner、推荐产品和新闻摘要 |
| 产品 | 分类侧边栏导航、产品卡片列表、详情页（概览/规格/图库/下载 Tab）、响应式图片画廊 |
| 新闻 | 按分类筛选的文章列表、CKEditor 富文本详情页 |
| 资源 | 可筛选的资源库，含登录门控的文件预览与下载 |
| 关于 | 公司介绍页，含荣誉墙卡片、触摸滚动和键盘导航支持 |
| 联系 | 联系表单，客户端验证和服务端提交 |
| 搜索 | 客户端全文搜索，覆盖产品/新闻/资源，多词匹配、加权评分、类型/分类筛选、分页和 URL 查询状态 |
| 认证 | 登录、注册、隐私政策和服务条款页面 |

**安全架构**

认证使用 httpOnly JWT Cookie。会话状态通过服务端端点刷新；未登录用户返回 `{ user: null }`，不暴露 401。登录、注册、登出和会话端点遵循同一套基于 Cookie 的流程。

```ts
// 安全响应头中间件
X-Content-Type-Options: nosniff
X-Frame-Options: SAMEORIGIN
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
```

`requestSecurity` 工具模块统一处理跨站防护：数据接收端点通过 `Origin` / `Fetch Metadata` 拒绝跨站 POST 请求，限制请求体大小，只接受 `application/json`。全局响应头添加了点击劫持、MIME 嗅探、Referrer、权限策略和基线 CSP 保护。

产品与新闻中的 CKEditor HTML 在渲染前经过严格属性白名单消毒：脚本、事件处理器、不安全 URL、任意 CSS 函数、嵌入内容和表单控件被移除，保留对齐、安全字号/字体、颜色、响应式图片宽度和表格尺寸调整。

**文件网关**

资源和产品的文件下载与预览通过 Nitro 路由流式传输，浏览器不会接触到原始 Strapi 媒体 URL。预览仅限浏览器安全类型（PDF, PNG, JPG, JPEG, WebP）。访问门控检查用户认证状态、资源可见性以及可选的邮箱白名单。

## 基础设施

### 服务端 Nitro 层

Nuxt Nitro 负责的 server-side 职责：

| 端点 | 功能 |
|------|------|
| `/api/strapi/**` | 公共 Strapi 内容代理，限制已知 Collection 根路径 |
| `/api/auth/**` | 登录、注册、登出、会话刷新、当前用户 |
| `/api/contact-message` | 联系表单提交 + 速率限制 + SMTP 通知 |
| `/api/resources/**` | 资源文件下载/预览网关 |
| `/api/products/**` | 产品文件下载/预览网关 |
| `/sitemap.xml` | 动态产品/新闻 URL + 静态回落 |
| `/robots.txt` | 爬虫指令 |

### 缓存策略

```ts [nuxt.config.ts]
routeRules: {
  '/login': { cache: false },
  '/api/auth/**': { cache: false },
  '/sitemap.xml': { swr: 3600 },
}
```

CDN 缓存建议：

| 资源 | 浏览器缓存 | CDN 缓存 |
|------|-----------|----------|
| `/_nuxt/**` | 1 年 immutable | 继承源站 |
| `/uploads/**` | 长缓存 | 继承源站 |
| 动态 HTML | `max-age=0` | `s-maxage=300`（可配置） |
| `/api/strapi/**` | `max-age=0` | 与 HTML 同步 |
| `/api/auth/**` | 不缓存 | 不缓存 |

缓存 TTL 通过环境变量 `NUXT_PUBLIC_HTML_CACHE_MAX_AGE`、`NUXT_PUBLIC_STRAPI_API_CACHE_MAX_AGE` 和 `NUXT_PUBLIC_STATIC_PAGE_CACHE_MAX_AGE` 控制。低频静态页面（privacy-policy、terms-of-use）应用较长 CDN 缓存。

### 部署

项目使用 PM2 守护进程 + systemd Nginx 反向代理：

```bash
# 构建与启动
pnpm typecheck && pnpm build
pm2 start .output/server/index.mjs --name site-web
pm2 save && pm2 startup
```

更新流水线：

```bash
cd /var/www/site
git pull && pnpm install && pnpm typecheck && pnpm build
pm2 restart site-web
```

## 改进

- Strapi 代理的查询参数校验仅允许 Strapi API 文档定义的顶层 key（`fields`, `filters`, `locale`, `pagination`, `populate`, `publicationState`, `sort`），防止注入
- 文件下载路由使用流式传输而非将整个文件读入内存再发送
- 搜索在客户端本地索引产品、新闻和资源，无需依赖 Meilisearch 等外部搜索服务
- Sitemap 路由从 Strapi 获取动态 URL，后端不可达时自动回落为静态条目并返回 `x-sitemap-status: static-fallback` 头
- 服务启动前通过 `scripts/validate-config.cjs` 校验环境变量，提前捕获缺失的密钥
- 认证端点对游客不报错 — 返回 `{ user: null }` 而非浏览器可见的 401
- Strapi 代理请求的分页参数上限为每页 100 条，防止意外大载荷
- 软删除插件默认关闭自动清理，需显式设置环境变量才能启用

## 修复

- Strapi Admin Vite 开发服务器的 host 已显式列入白名单，防止使用隧道服务时出现 EPERM 和 host-check 错误
- Strapi 本地化报告改为按需生成，不再以仓库快照形式提交
- 未到发布日期的草稿条目不再出现在公共 API 响应中——公共代理请求将 `publicationState` 显式设为 `live`
- CKEditor 渲染的过宽表格已做换行处理，防止移动端横向溢出
- 通过软删除插件配置，已软删除的条目默认不出现在公共 API 响应中
- Vite HMR 后 Admin 标题替换和按钮标签偶发丢失 — DOM 观察器确保热更新后依然正确

## 已知问题

- Strapi Admin 构建链仍以 CommonJS 方式加载 Vite Node API，会输出 `CJS deprecation` 提示但不影响功能
- 内存速率限制器在 PM2 集群模式或多节点部署下会失效，届时需切换至 Redis 共享存储

## 升级说明

从 v0.2.0 升级：

```bash
cd /var/www/site
git pull
pnpm install
pnpm typecheck
pnpm build
pm2 restart site-web
```

新增环境变量（可选，不设置则使用默认值）：

```dotenv
NUXT_PUBLIC_HTML_CACHE_MAX_AGE=300
NUXT_PUBLIC_STRAPI_API_CACHE_MAX_AGE=300
NUXT_PUBLIC_STATIC_PAGE_CACHE_MAX_AGE=3600
SOFT_DELETE_AUTO_PURGE_ENABLED=false
SOFT_DELETE_AUTO_PURGE_TTL_DAYS=30
```

::callout{type="terminal" title="发布信号"}
双语编辑后台 → 缓存内容代理 → 安全认证网关 → CDN 边缘交付，全链路就绪。后续：性能基线、Strapi Webhook 缓存刷新、细粒度权限。
::
