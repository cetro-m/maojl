---
title: Linux 常用命令速查与指南
description: Linux 常用命令分类整理，涵盖文件管理、文本处理、进程控制、网络诊断和系统信息查询，附实用示例和易错提醒。
date: 2025-04-12
category: engineering
tags:
  - linux
featured: false
draft: false
readingTime: 12 min read
---

## 背景

Linux 命令行是开发者的日常工具。无论本地开发、远程服务器维护还是 CI/CD 流水线操作，掌握一批稳定、高效的命令能显著减少对搜索引擎的依赖。

本文面向有基础语法概念但希望系统化整理常用命令的开发者。按使用场景分类，每类给出最常用的命令和典型组合，最后补充容易忽略的注意事项。

## 文件与目录操作

### 基础命令

```bash
# 列出当前目录内容（隐藏文件、详细信息、按时间排序）
ls -laht

# 递归创建目录
mkdir -p project/{src,docs,test}

# 复制与移动
cp -r source/ dest/       # 递归复制
rsync -avz --progress     # 增量同步，更适合大文件
mv oldname newname        # 移动或重命名

# 安全删除
rm -rf dir/               # 慎用，-rf 不确认直接删
```

### 查找文件

```bash
# find：按名称、类型、大小、时间过滤
find . -name "*.log" -mtime +7 -delete   # 删除 7 天前的 .log
find . -type f -size +100M               # 找超过 100MB 的文件

# fd：更快的现代替代（需要安装）
fd "\.py$" -x wc -l                      # 找 .py 文件并统计行数

# locate：依赖数据库，查找极快（需要 updatedb 更新索引）
locate nginx.conf
```

## 文本处理

文本处理是命令行最强大的能力之一，适合在管道中组合使用。

### 查看文件

```bash
cat file.txt          # 全文输出，适合小文件
less file.txt         # 翻页查看，/搜索，q 退出
head -n 20 file.txt   # 前 20 行
tail -n 50 file.txt   # 后 50 行
tail -f app.log       # 实时跟踪日志追加
```

### grep：文本搜索

```bash
grep -rn "error" --include="*.log" ./
grep -i "warning" app.log                # 忽略大小写
grep -c "timeout" access.log             # 只计数
grep -v "healthy" check.log              # 排除匹配行

# 上下文查看
grep -B 3 -A 5 "Exception" crash.log     # 前 3 行 + 后 5 行
```

### sed：流编辑

```bash
sed -i 's/old/new/g' file.txt            # 原地替换全部匹配
sed -n '10,20p' file.txt                 # 打印第 10 到 20 行
sed '/^#/d' config.conf                  # 删除注释行
```

### awk：结构化文本处理

```bash
# 列提取与条件过滤
awk '{print $1, $3}' access.log          # 打印第 1、3 列
awk '$4 > 500 {print $1, $4}' stats.txt  # 输出第 4 列 > 500 的行

# 内置变量
awk 'NR%2==0' file.txt                   # 只打印偶数行
awk '{sum+=$1} END{print sum}' nums.txt  # 累加第一列
```

::callout{type="warning" title="注意"}
`awk` 和 `sed` 的单引号在 shell 中保护 `$` 符号，避免变量展开。如果需要在表达式中嵌入 shell 变量，可以用双引号包裹：`awk "{print \$$var}"` 或通过 `-v` 传参：`awk -v col="$var" '{print $col}'`。
::

### 排序与去重

```bash
sort -k2 -t, data.csv                    # 按第二列排序
sort -u file.txt                         # 排序 + 去重
uniq -c sorted.txt                       # 统计连续重复次数
```

## 进程与系统管理

### 进程查看与控制

```bash
ps aux                                   # 所有进程快照
ps aux --sort=-%mem | head -5            # 内存 TOP 5
top -o %MEM                              # 交互式进程监视

# 按名称查找 PID
pgrep -f "node app.js"
pidof nginx

# 终止进程
kill -15 <PID>                           # 优雅退出（SIGTERM）
kill -9 <PID>                            # 强制杀死（SIGKILL）
pkill -f "node app.js"                   # 按名称匹配杀死
```

### 后台运行

```bash
nohup python server.py > output.log 2>&1 &
# 或者使用 systemd 管理长期服务
# 或者用 tmux/screen 保持终端会话

# 查看后台进程
jobs -l
bg/fg                                    # 前后台切换
```

### 系统资源

```bash
df -h                                    # 磁盘分区使用率
du -sh * | sort -rh | head -10           # 当前目录 TOP 10 大占用
free -h                                  # 内存占用
uptime                                   # 运行时长 + 负载均值
lscpu                                    # CPU 架构信息
```

## 网络诊断

```bash
# HTTP 请求
curl -v https://api.example.com          # 带请求/响应头详情
curl -o file.zip -L https://example.com/file.zip   # 下载并跟随重定向
curl -X POST -H "Content-Type: application/json" \
  -d '{"key":"value"}' https://api.example.com/endpoint

# 连接诊断
ping -c 4 google.com                     # 连通性 + 延迟
ss -tlnp                                 # 查看监听端口（现代版 netstat）
netstat -tulpn                           # 传统版（需要安装）
telnet host 80                           # 手动测试 TCP 端口
nc -zv host 22 80 443                    # 批量端口探测

# DNS 查询
nslookup example.com
dig example.com +short
```

## 权限管理

```bash
chmod 755 script.sh                      # rwxr-xr-x（所属者可写，其他只读执行）
chmod +x script.sh                       # 添加可执行权限
chown user:group file.txt                # 修改所属用户和组
chattr +i config.yaml                    # 锁定文件禁止修改（root 才能解除）

# 查看权限
ls -l                                    # 第一列即权限位
stat file.txt                            # 更详细的元信息
```

## 压缩与归档

```bash
# tar（最通用）
tar -czf archive.tar.gz dir/             # 创建 .tar.gz
tar -xzf archive.tar.gz                  # 解压
tar -tf archive.tar.gz                   # 查看内容

# zip（跨平台交换）
zip -r archive.zip dir/
unzip -l archive.zip                     # 查看内容而不解压
unzip archive.zip -d dest/

# 快速压缩单个文件
gzip -k file.txt                         # 保留原文件
gzip -d file.txt.gz                      # 解压
```

## 组合实战：日志排查场景

```bash
# 场景：500 错误已经出现，需要找出所有 5xx 响应并分析
zgrep -h "HTTP/1.1\" 5[0-9][0-9]" access.log.2.gz access.log.1.gz access.log \
  | awk '{print $1}' \
  | sort \
  | uniq -c \
  | sort -rn \
  | head -20
```

这个管道组合做了：
1. `zgrep` 并行搜索多个 `.gz` 和当前日志，匹配 HTTP 5xx 状态码
2. `awk` 提取第一列（通常是客户端 IP）
3. `sort | uniq -c` 统计每个 IP 的请求次数
4. 再 `sort -rn` 按次数降序排列
5. `head -20` 取 TOP 20

## 常见陷阱

### 容易被误解的命令

```bash
# 1. chmod 644 与 755 的含义不要搞混
#    644 = rw-r--r--（文件默认安全权限）
#    755 = rwxr-xr-x（目录和可执行脚本）

# 2. cp 与 mv 的区别
#    cp 复制，源文件保留
#    mv 移动或重命名，源文件消失

# 3. rm -rf 的谨慎使用
#    习惯用 rm -ri 或先 ls 确认再删
#    设置别名：alias rm='rm -i'

# 4. tar -czf 与 -xzf 的参数顺序
#    -f 必须在紧跟的归档文件名之前
#    正确：tar -czf archive.tar.gz dir/
#    错误：tar -cfz archive.tar.gz dir/
```

### 管道中变量失效

```bash
# 错误的写法
cat file.txt | while read line; do
  count=$((count + 1))
done
echo $count   # 输出 0！子 shell 变量不传回

# 正确的写法
count=0
while read line; do
  count=$((count + 1))
done < file.txt
echo $count   # 正确
```

## 总结

Linux 命令行的核心能力不是记忆每个参数，而是理解三类思维方式：

1. **组合思维** — 管道 `|` 连接小命令完成复杂任务
2. **文本思维** — 一切皆文本流，用 grep/sed/awk 处理结构化输出
3. **可逆思维** — 写脚本前先用 `echo` 或 `--dry-run` 验证意图

建议在新服务器上先做三件事：

```bash
# 1. 设置安全别名
alias rm='rm -i'
alias mv='mv -i'
alias cp='cp -i'

# 2. 启用历史时间戳
export HISTTIMEFORMAT="%F %T "

# 3. 安装 tldr（简化版 man，适合快速回忆）
npm install -g tldr
# 或 pip install tldr

# 用法：tldr tar / tldr find
```

后续可以继续深入的方向：Shell 脚本最佳实践、Vim 高效编辑、tmux 终端复用、以及 systemd 服务管理。
