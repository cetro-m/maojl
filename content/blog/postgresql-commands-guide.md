---
title: PostgreSQL 日常运维与查询实战
description: 面向开发者的 PostgreSQL 常用操作指南，涵盖数据库管理、表操作、索引优化、备份恢复、性能诊断和事务排查，附真实场景 SQL 示例。
date: 2025-07-24
category: engineering
tags:
  - postgresql
  - database
  - sql
featured: false
draft: false
readingTime: 14 min read
---

## 背景

PostgreSQL 在开发和生产环境中越来越常见。大部分开发者能写出 CRUD，但面对连接池耗尽、慢查询优化、锁等待排查等场景时，往往需要临时翻文档。

本文以 PostgreSQL 14+ 为主，按使用频率分类整理日常必需的数据库操作。假设你已经安装好了 PostgreSQL 客户端（`psql`）。

## 连接与基础操作

### 连接数据库

```bash
# 连接到本地数据库
psql -U postgres -d mydb

# 连接到远程数据库
psql -h db.example.com -p 5432 -U app_user -d app_db

# 使用连接字符串
psql "postgresql://app_user:password@db.example.com:5432/app_db?sslmode=require"

# 直接在命令行执行 SQL
psql -U postgres -d mydb -c "SELECT NOW();"
psql -U postgres -d mydb -f dump.sql     # 执行 SQL 文件
```

### psql 常用元命令

```bash
\l                    # 列出所有数据库
\c mydb               # 切换到 mydb
\d                    # 列出当前 schema 的所有表、视图、序列
\d tablename          # 查看表结构（列、类型、约束、索引）
\di                   # 列出所有索引
\du                   # 列出所有用户/角色
\dn                   # 列出所有 schema
\df                   # 列出所有函数
\dv                   # 列出所有视图
\dt                   # 只列出表
\db                   # 列出表空间
\l+                   # 显示更详细的数据库信息（包括大小、编码）

\i /path/to/file.sql  # 执行 SQL 文件
\o /path/to/output    # 将查询结果写入文件
\e                    # 用外部编辑器编辑查询
\x                    # 切换扩展显示（行转列，适合宽表）
\x auto               # 自动选择显示模式
\timing               # 显示每条 SQL 的执行时间
\conninfo             # 显示当前连接信息
\! clear              # 执行 shell 命令（清屏）
```

## 数据库与用户管理

```sql
-- 创建数据库
CREATE DATABASE mydb WITH ENCODING 'UTF8' LC_COLLATE 'zh_CN.UTF-8' LC_CTYPE 'zh_CN.UTF-8';

-- 创建用户并授权
CREATE USER app_user WITH PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE mydb TO app_user;

-- 授予 schema 级别权限（连接数据库后还需要 schema 权限）
\c mydb
GRANT ALL ON SCHEMA public TO app_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO app_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO app_user;

-- 修改用户属性
ALTER USER app_user WITH CONNECTION LIMIT 50;        -- 限制并发连接数
ALTER USER app_user VALID UNTIL '2027-01-01';        -- 设置密码过期时间

-- 查看当前连接
SELECT pid, usename, application_name, client_addr, state, query
FROM pg_stat_activity
WHERE datname = 'mydb';
```

## 表操作与常用查询

### 建表与约束

```sql
CREATE TABLE users (
    id          BIGSERIAL PRIMARY KEY,
    username    VARCHAR(64) NOT NULL UNIQUE,
    email       VARCHAR(255) NOT NULL,
    status      SMALLINT NOT NULL DEFAULT 1,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_status CHECK (status IN (0, 1, 2))
);

-- 添加索引
CREATE INDEX idx_users_email ON users (email);
CREATE INDEX idx_users_created_at ON users (created_at DESC);

-- 部分索引（只索引活跃用户）
CREATE INDEX idx_users_active ON users (created_at) WHERE status = 1;

-- 唯一复合索引
CREATE UNIQUE INDEX idx_users_email_status ON users (email, status);
```

### 常用查询模式

```sql
-- 分页查询（游标分页优于 OFFSET 分页）
-- 游标分页：WHERE id > $last_seen_id ORDER BY id LIMIT 20
-- OFFSET 分页在深翻页时性能急剧下降
SELECT * FROM users WHERE id > 1000 ORDER BY id LIMIT 20;

-- 去重统计
SELECT DATE_TRUNC('day', created_at) AS day, COUNT(DISTINCT user_id)
FROM orders
WHERE created_at >= NOW() - INTERVAL '7 days'
GROUP BY day
ORDER BY day;

-- 窗口函数：分组 TOP N
SELECT * FROM (
    SELECT *,
        ROW_NUMBER() OVER (PARTITION BY category_id ORDER BY score DESC) AS rn
    FROM products
) ranked WHERE rn <= 5;

-- CTE 递归查询（树形结构）
WITH RECURSIVE org_tree AS (
    SELECT id, name, parent_id, 1 AS depth
    FROM departments WHERE parent_id IS NULL
    UNION ALL
    SELECT d.id, d.name, d.parent_id, t.depth + 1
    FROM departments d JOIN org_tree t ON d.parent_id = t.id
)
SELECT * FROM org_tree ORDER BY depth, id;
```

## 索引与性能诊断

### 查看查询计划

```sql
-- 分析查询执行计划
EXPLAIN ANALYZE
SELECT * FROM orders WHERE user_id = 123 AND created_at > '2026-01-01';

-- 重点关注的指标：
-- Seq Scan on large_table  → 需要加索引
-- Index Scan               → 正在使用索引，效果良好
-- Bitmap Heap Scan         → 多索引组合，还可接受
-- Sort Method: external    → 排序内存不足，需要增加 work_mem
-- Rows Removed by Filter   → 大量行被过滤，索引选择性不够
```

### 索引维护

```sql
-- 查看表的大小和索引使用情况
SELECT
    relname AS table_name,
    pg_size_pretty(pg_total_relation_size(relid)) AS total_size,
    pg_size_pretty(pg_relation_size(relid)) AS table_size,
    pg_size_pretty(pg_indexes_size(relid)) AS indexes_size,
    n_live_tup AS row_count
FROM pg_stat_user_tables
ORDER BY pg_total_relation_size(relid) DESC;

-- 查找未使用的索引（pg_stat_user_indexes 的 idx_scan 接近 0 的索引考虑删除）
SELECT
    schemaname, tablename, indexname, idx_scan, idx_tup_read,
    pg_size_pretty(pg_relation_size(indexrelid)) AS index_size
FROM pg_stat_user_indexes
WHERE idx_scan < 100
ORDER BY idx_scan ASC, pg_relation_size(indexrelid) DESC;

-- 重建索引（避免索引膨胀）
REINDEX INDEX idx_users_email;
REINDEX TABLE users;
```

### 常见慢查询原因

```sql
-- 当前运行的慢查询
SELECT pid, NOW() - pg_stat_activity.query_start AS duration, query, state
FROM pg_stat_activity
WHERE state != 'idle'
  AND NOW() - pg_stat_activity.query_start > INTERVAL '5 seconds'
ORDER BY duration DESC;
```

| 现象 | 常见原因 | 对策 |
|------|----------|------|
| Seq Scan on 大表 | 缺少索引或查询条件不匹配索引 | 根据 WHERE 条件创建索引 |
| Bitmap Heap Scan 过多 | 查询条件组合复杂 | 创建复合索引 |
| 排序导致临时文件 | `work_mem` 太小 | 增加 `work_mem` |
| 索引未被使用 | 数据类型不匹配或函数包裹了字段 | 避免 `WHERE DATE(col) = ...` |
| Nested Loop 嵌套过深 | 多表 JOIN 缺少索引 | 在 JOIN 列上建索引 |

::callout{type="warning" title="注意"}
不要在索引列上包裹函数，例如 `WHERE DATE(created_at) = '2026-01-01'` 会使索引失效。应使用范围查询：`WHERE created_at >= '2026-01-01' AND created_at < '2026-01-02'`。
::

## 备份与恢复

```bash
# 备份单个数据库（自定义格式，支持压缩和并行）
pg_dump -U postgres -Fc -j 4 mydb > mydb.dump

# 备份单个表
pg_dump -U postgres -t users -Fc mydb > users.dump

# 备份所有数据库
pg_dumpall -U postgres > all_databases.sql

# 恢复自定义格式备份
pg_restore -U postgres -d mydb -j 4 mydb.dump
pg_restore -U postgres -d mydb -t users users.dump   # 恢复特定表

# SQL 格式备份恢复
psql -U postgres -d mydb < dump.sql

# 远程备份
pg_dump -h prod.example.com -U app_user -Fc mydb > prod_backup.dump
```

### 备份策略建议

```bash
# 每天凌晨 3 点执行完整备份并保留 7 天
0 3 * * * pg_dump -U postgres -Fc -j 4 mydb > /backups/mydb_$(date +\%Y\%m\%d).dump && \
          find /backups -name "mydb_*.dump" -mtime +7 -delete
```

## 事务与锁排查

### 事务隔离级别

```sql
-- 查看当前事务隔离级别
SHOW transaction_isolation;

-- 设置事务隔离级别
BEGIN;
SET TRANSACTION ISOLATION LEVEL REPEATABLE READ;
-- 执行查询...
COMMIT;
```

PostgreSQL 默认使用 `READ COMMITTED`，对大多数应用已经足够。`SERIALIZABLE` 提供最强一致性保证，但并发性能会显著下降。

### 锁等待排查

```sql
-- 查看锁等待的会话
SELECT
    blocked.pid AS blocked_pid,
    blocked.query AS blocked_query,
    blocking.pid AS blocking_pid,
    blocking.query AS blocking_query,
    blocked_age.age AS blocked_duration
FROM pg_stat_activity blocked
JOIN pg_locks blocked_locks ON blocked.pid = blocked_locks.pid
JOIN pg_locks blocking_locks ON blocking_locks.locktype = blocked_locks.locktype
    AND blocking_locks.database = blocked_locks.database
    AND blocking_locks.relation = blocked_locks.relation
    AND blocking_locks.pid != blocked.pid
JOIN pg_stat_activity blocking ON blocking.pid = blocking_locks.pid
CROSS JOIN LATERAL (
    SELECT NOW() - blocked.query_start AS age
) blocked_age
WHERE NOT blocked_locks.granted;

-- 终止阻塞的会话（谨慎使用）
SELECT pg_terminate_backend(<blocking_pid>);
```

::callout{type="warning" title="注意"}
`pg_terminate_backend` 会强制杀死后台进程，可能导致未提交的事务回滚。在生产环境中执行前请确认影响。
::

## 配置调优

以下参数默认值偏保守，适合开发环境。生产服务器应根据硬件调整。

```sql
-- 查看当前配置
SHOW shared_buffers;
SHOW work_mem;
SHOW effective_cache_size;
SHOW maintenance_work_mem;
SHOW random_page_cost;

-- 建议配置（以 16GB RAM 服务器为例）
-- 修改 postgresql.conf 后需要重启
```

```ini [postgresql.conf]
# 内存配置
shared_buffers = 4GB              # 总内存的 25%
effective_cache_size = 12GB       # 总内存的 75%（OS 缓存估算）
work_mem = 64MB                   # 每个查询排序可用内存
maintenance_work_mem = 1GB        # VACUUM、CREATE INDEX 可用内存

# 写入配置
wal_buffers = 16MB
max_wal_size = 4GB
checkpoint_completion_target = 0.9

# 连接配置
max_connections = 200
```

## 日常健康检查

```sql
-- 1. 数据库大小排名
SELECT datname, pg_size_pretty(pg_database_size(datname)) AS size
FROM pg_database
ORDER BY pg_database_size(datname) DESC;

-- 2. 表膨胀率（死元组占比）
SELECT
    schemaname, relname,
    n_dead_tup, n_live_tup,
    ROUND(100 * n_dead_tup / NULLIF(n_live_tup + n_dead_tup, 0), 2) AS dead_pct
FROM pg_stat_user_tables
WHERE n_dead_tup > 1000
ORDER BY dead_pct DESC;

-- 3. autovacuum 是否健康运行
SELECT relname, last_autovacuum, last_autoanalyze
FROM pg_stat_user_tables
WHERE last_autovacuum IS NULL OR last_autoanalyze IS NULL;

-- 4. 长事务
SELECT pid, state, xact_start, NOW() - xact_start AS duration, query
FROM pg_stat_activity
WHERE state = 'idle in transaction'
   OR (state = 'active' AND NOW() - xact_start > INTERVAL '10 minutes')
ORDER BY xact_start;

-- 5. 未使用的索引浪费的空间
SELECT
    schemaname, tablename, indexname,
    pg_size_pretty(pg_relation_size(indexrelid)) AS size
FROM pg_stat_user_indexes
WHERE idx_scan = 0
ORDER BY pg_relation_size(indexrelid) DESC;
```

## 总结

PostgreSQL 日常运维的四个核心习惯：

1. **日常检查** — 每周运行一次健康检查 SQL，关注死元组率、长事务和未使用索引
2. **索引先行** — 写查询之前先 `EXPLAIN ANALYZE`，不出意外再用到生产
3. **备份保底** — 配置定时 `pg_dump`，并定期验证备份文件可用性
4. **配置匹配硬件** — `shared_buffers`、`work_mem`、`effective_cache_size` 三项内存参数按硬件比例调整

后续可以继续深入：VACUUM 原理与调优、流复制搭建、分区表设计，以及使用 pg_stat_statements 进行长期性能基线分析。
