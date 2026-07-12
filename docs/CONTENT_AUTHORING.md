# Blog、Notes 与 Releases 编写规范

本文档说明 `content/blog`、`content/notes` 和 `content/releases` 下 Markdown 内容的编写方式。字段约束以项目根目录的 `content.config.ts` 为准。

## 通用规范

- 文件必须使用 UTF-8 编码。
- 文件名使用小写英文、数字和连字符，例如 `nuxt-content-guide.md`。
- 文件名会成为公开 URL 的最后一段；发布后不要随意重命名，否则旧链接会失效。需要分组时可以使用子目录，目录名也遵循同一命名规则。
- 日期统一使用 ISO 日期格式 `YYYY-MM-DD`。
- `date` 仅表示内容日期，不具备定时发布功能。未来日期不会阻止内容上线，是否公开只由 `draft` 控制。
- Frontmatter 必须位于文件顶部，并使用 `---` 包围。
- Frontmatter 使用 YAML；含冒号、`#`、前后空格或其他特殊字符的字符串应加引号，避免被解析成错误类型。
- 正文从二级标题 `##` 开始。页面主标题由 Frontmatter 中的 `title` 渲染，不要在正文重复书写 `# 标题`。
- `draft: true` 的内容不会出现在列表、详情查询或搜索结果中。Schema 默认值是 `false`，因此写作阶段必须显式填写 `draft: true`，不要依赖省略字段。
- 二级、三级标题会进入详情页目录，并生成可访问的 `#` 锚点。标题文本应简短且尽量保持稳定，避免外部锚点失效。
- 标题和摘要必须是非空纯文本；`description` 建议控制在一到两句话，不写 Markdown、换行或重复标题。
- 内部链接使用站点根路径，例如 `[相关文章](/blog/example)`，不要链接 Markdown 源文件或写 `.md` 后缀。外部链接使用完整 HTTPS URL。
- 图片建议放在 `public/images` 下，并通过 `/images/example.webp` 引用。每张内容图片必须提供有意义的替代文本；纯装饰图片使用空替代文本。
- 不要在正文、代码块、截图或示例 URL 中写入真实密码、Token、Cookie、私钥、内网地址或生产连接串；统一使用明显的占位值。
- 发布内容前执行 `pnpm validate`，它会依次完成类型检查与生产构建。

## Blog

### 用途

Blog 用于较完整的技术文章、教程、经验总结和长期有效的内容。文件放在：

```text
content/blog/
```

### Frontmatter 字段

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `title` | 是 | 文章标题 |
| `description` | 是 | 用于列表、搜索、SEO 和分享卡片的摘要 |
| `date` | 是 | 发布日期，格式为 `YYYY-MM-DD` |
| `category` | 是 | 内容分类，建议使用稳定的小写英文名称 |
| `tags` | 否 | 标签数组，默认为空数组 |
| `featured` | 否 | 是否作为精选内容展示，默认为 `false` |
| `draft` | 否 | 是否为草稿，默认为 `false` |
| `readingTime` | 否 | 预计阅读时间，例如 `8 min read` |
| `ogImage` | 否 | 自定义 OG 图片配置 |
| `robots` | 否 | 搜索引擎抓取配置 |
| `sitemap` | 否 | Sitemap 配置 |
| `head` | 否 | 自定义 Meta 或 Script 配置 |

除非确实需要覆盖自动生成的 SEO 信息，否则不要填写 `ogImage`、`robots`、`sitemap` 或 `head`。自定义 `head.script` 前必须确认脚本来源可信，并在本地检查最终页面源码。

### 内容建议

推荐按照“背景与目标 → 核心思路 → 实现过程 → 注意事项 → 总结”的顺序组织正文。

每篇文章应：

- 围绕一个明确主题展开。
- 在开头说明问题背景和文章目标。
- 为代码块标注语言；必要时添加文件名。
- 使用标题拆分长内容，避免连续的大段文字。
- 在结尾总结结论和后续方向。
- 示例命令应说明适用系统、所需权限和潜在副作用；删除、覆盖、数据库写入等危险操作必须明确提示。

### Blog 模板

````md
---
title: 文章标题
description: 用一到两句话概括文章解决的问题和主要内容。
date: 2026-07-12
category: engineering
tags:
  - nuxt
  - content
featured: false
draft: true
readingTime: 8 min read
---

## 背景

介绍问题背景、使用场景以及编写本文的原因。

## 核心思路

解释主要方案和关键设计决策。

## 实现过程

```ts [example.ts]
export const example = true
```

## 注意事项

- 注意事项一
- 注意事项二

::callout{type="warning" title="注意"}
这里填写需要特别提醒的内容。
::

## 总结

总结最终结果以及后续可以继续改进的方向。
````

## Notes

### 用途

Notes 用于短记录、开发日志、问题排查、实验结果和临时结论。文件放在：

```text
content/notes/
```

Notes 与 Blog 使用相同的 Frontmatter Schema，但正文应更短、更聚焦。

### 内容建议

- 每篇只记录一个问题、发现或结论。
- 优先记录现象、处理方法、最终结论和后续事项。
- 不需要补充完整的教程背景。
- `featured` 通常保持为 `false`。
- `readingTime` 建议使用 `1 min read` 到 `3 min read`。
- 如果内容已经形成完整方法论或长期教程，应写入 Blog。

### Notes 模板

````md
---
title: 简短记录标题
description: 一句话说明这条记录的内容或结论。
date: 2026-07-12
category: build-log
tags:
  - nuxt
  - debugging
featured: false
draft: true
readingTime: 2 min read
---

## 现象

描述遇到的问题、观察到的行为或记录背景。

## 处理

说明采取的操作。

```bash
pnpm run typecheck
```

## 结论

记录最终结论、影响范围以及是否需要后续处理。
````

对于非常短的记录，可以使用精简版本：

```md
---
title: 简短记录标题
description: 这条记录的简要说明。
date: 2026-07-12
category: field-note
tags:
  - tooling
featured: false
draft: false
readingTime: 1 min read
---

## 记录

直接填写正文内容。
```

## Releases

### 用途

Releases 用于记录正式发布、预发布版本或可追踪构建。文件放在：

```text
content/releases/
```

文件名建议直接使用版本号：

```text
content/releases/v0.3.0.md
content/releases/v0.4.0-beta.1.md
```

### Frontmatter 字段

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `title` | 是 | 本次发布的名称 |
| `description` | 是 | 发布摘要 |
| `version` | 是 | 符合项目规则的语义化版本号 |
| `date` | 是 | 发布日期，格式为 `YYYY-MM-DD` |
| `latest` | 否 | 是否为最新正式版本，默认为 `false` |
| `prerelease` | 否 | 是否为预发布版本，默认为 `false` |
| `draft` | 否 | 是否为草稿，默认为 `false` |
| `commit` | 否 | Commit SHA、Tag 或构建标识 |
| `repositoryUrl` | 否 | 仓库或 Release 页面的完整 URL |
| `compareUrl` | 否 | 版本比较页面的完整 URL |
| `assets` | 否 | 下载附件数组，默认为空数组 |

`assets` 中的每个附件支持以下字段：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `name` | 是 | 文件名称 |
| `url` | 是 | 文件的完整下载 URL |
| `size` | 否 | 文件大小，例如 `84 MB` |
| `platform` | 否 | 目标平台，例如 `Windows x64` |

### 版本号规则

允许的版本号：

```text
v1.0.0
1.0.0
v1.2.0-beta.1
v2.0.0-rc.2
```

不允许的版本号：

```text
v1
1.0
release-1.0.0
```

### 发布维护规则

- 建议只保留一个 `latest: true`。
- 发布新正式版本时，应同时把旧正式版本的 `latest` 改为 `false`；该唯一性由作者维护，Schema 不会自动阻止多个 latest。
- 预发布版本必须设置 `prerelease: true`。
- 尚未完成的发布记录应设置 `draft: true`。
- Releases Index 根据 `date` 从新到旧排序。
- `repositoryUrl`、`compareUrl` 和附件 `url` 必须是完整 URL。
- 正文应记录用户可感知的变化，不要直接堆叠 Git Commit。
- 如果版本包含破坏性变更，必须提供升级或迁移说明。

### Releases 模板

```md
---
title: 版本发布标题
description: 简要说明本次版本的主要功能、修复和影响。
version: v0.3.0
date: 2026-07-12
latest: true
prerelease: false
draft: true
commit: abc1234
repositoryUrl: https://github.com/username/repository
compareUrl: https://github.com/username/repository/compare/v0.2.0...v0.3.0
assets: []
---

## 概览

简要介绍本次发布的目标和最重要的变化。

## 新增

- 新增功能一
- 新增功能二

## 改进

- 改进现有功能或交互
- 优化性能或开发体验

## 修复

- 修复问题一
- 修复问题二

## 升级说明

说明是否存在配置变更、迁移操作或兼容性影响。

## 已知问题

- 当前仍然存在的问题
```

### 带附件的 Releases Frontmatter

```yaml
---
title: Desktop client release
description: Adds desktop packages and improves startup performance.
version: v1.0.0
date: 2026-07-12
latest: true
prerelease: false
draft: false
commit: a1b2c3d
repositoryUrl: https://github.com/username/repository
compareUrl: https://github.com/username/repository/compare/v0.9.0...v1.0.0
assets:
  - name: application-windows-x64.zip
    url: https://example.com/downloads/application-windows-x64.zip
    size: 84 MB
    platform: Windows x64
  - name: application-macos-arm64.dmg
    url: https://example.com/downloads/application-macos-arm64.dmg
    size: 91 MB
    platform: macOS Apple Silicon
---
```

## MDC 与 Markdown 用法

当前项目只提供 `Callout` 自定义 MDC 组件，以及 H2、表格的自定义 Prose 渲染。不要直接使用文档示例以外、项目中不存在的 MDC 组件；不要嵌入未经审核的原始 HTML。

### Callout

`type` 只允许 `note`、`warning`、`terminal`。省略时默认为 `note`。

普通提示：

```md
::callout{type="note" title="提示"}
这里填写补充说明。
::
```

```md
::callout{type="warning" title="注意"}
这里是需要强调的内容。
::
```

终端风格：

```md
::callout{type="terminal" title="Command"}
这里填写命令或终端相关提示。
::
```

### 代码块

代码块必须标注语言：

````md
```ts
const enabled = true
```
````

需要展示文件名时：

````md
```ts [content.config.ts]
export default defineContentConfig({})
```
````

- 语言标识优先使用项目中已有的常见值，例如 `ts`、`vue`、`js`、`bash`、`json`、`yaml`、`md`、`sql`、`ini`、`dotenv` 或 `text`。
- 示例应保持可复制；省略内容时用文字解释，不要把 `...` 放进可能被直接执行的命令或配置。
- 展示终端命令时，不包含 Shell 提示符 `$` 或 `root@host#`，方便复制。

### 链接、图片与表格

```md
[站内文章](/blog/linux-common-commands)
[外部文档](https://content.nuxt.com/)

![描述图片实际内容的替代文本](/images/example.webp)
```

- 发布前逐一打开站内链接和外部链接，确认没有 404、登录墙或临时地址。
- 图片文件名使用小写英文、数字和连字符；提交前压缩图片，优先使用 WebP/JPEG，避免把原始大图直接放进仓库。
- 表格列数较多时在 320px 宽度下预览；项目会提供横向滚动，但单元格内容仍应尽量简短。

## 发布检查清单

发布 Blog、Notes 或 Releases 前检查：

- Frontmatter 必填字段是否完整。
- 日期是否使用 `YYYY-MM-DD`。
- 文件名是否使用小写英文和连字符。
- 正文是否从 `##` 开始。
- 是否正确设置 `draft`。
- 是否误把未来日期当成定时发布。
- 标签与分类名称是否保持一致。
- 标题、摘要、标题锚点和公开 URL 是否稳定且无错别字。
- Release 版本号与 URL 是否符合 Schema。
- 是否存在失效链接、无替代文本的图片或缺少语言标识的代码块。
- 是否清除了真实密钥、账号、Cookie、内网地址和生产连接信息。
- 新正式 Release 是否取消了旧版本的 `latest: true`。
- `pnpm validate` 是否通过。
