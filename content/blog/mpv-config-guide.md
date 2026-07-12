---
title: mpv.conf 配置与性能调优
description: mpv 播放器的配置文件详解——视频/音频/字幕选项、硬件解码、性能调优和场景配置模板。
date: 2025-02-13
category: engineering
tags:
  - mpv
  - video
  - configuration
featured: false
draft: false
readingTime: 8 min read
---

## 配置体系

mpv 按以下顺序加载配置，后覆盖前：

| 系统 | 路径 |
|------|------|
| Linux | `~/.config/mpv/mpv.conf` |
| Windows | `%APPDATA%\mpv\mpv.conf` |
| macOS | `~/.config/mpv/mpv.conf` |

语法：`option=value`，`#` 注释，行末不要有空格。profile 块用 `[name]` 定义。

目录结构：

```text
~/.config/mpv/
├── mpv.conf          # 主配置
├── input.conf        # 按键绑定
├── script-opts/      # 脚本参数
└── scripts/          # Lua/JavaScript 脚本
```

## 视频核心

### 输出驱动

```ini
vo=gpu-next            # 推荐，支持 Vulkan/OpenGL
gpu-api=vulkan         # 性能最好，Linux/Windows 优先
```

### 硬件解码

```ini
hwdec=nvdec            # NVIDIA 纯解码（省电）
hwdec=cuda             # NVIDIA 更广兼容
hwdec=vaapi            # Intel/AMD Linux
hwdec=d3d11va          # Intel Windows
hwdec=videotoolbox-copy # macOS
```

::callout{type="warning" title="注意"}
花屏或绿屏时 `hwdec=no` 回退软件解码。
::

### 画质

```ini
scale=ewa_lanczossharp      # 放大
dscale=mitchell             # 缩小
cscale=bilinear             # 色度缩放
linear-scaling=yes          # 线性光域缩放
sigmoid-upscaling=yes       # S 形上采样
correct-downscaling=yes     # 修正缩小混叠
icc-profile-auto=yes        # 加载校色文件
tone-mapping=hable          # HDR→SDR 映射
```

### 帧率同步

```ini
video-sync=display-resample
interpolation=yes                    # 运动插值
interpolation-past-frames=8
interpolation-future-frames=8
```

## 音频

```ini
ao=wasapi                   # Windows
audio-normalize-downmix=yes
audio-format=float
audio-channels=auto
volume-max=200
```

## 字幕

```ini
sub-auto=fuzzy
sub-font="Source Han Sans SC"
sub-font-size=48
sub-border-size=2
sub-ass-override=force      # 覆盖 ASS 样式
sub-shadow-offset=1.5
```

## 性能调优

### 缓存

```ini
cache=yes
cache-default=50000          # 50MB
cache-secs=300               # 网络流最大缓冲秒数
```

### 加速参数

```bash
# 低显存（4-6GB）
--lowvram

# 推荐平衡（8-12GB）
--medvram --xformers --force-fp16

# 高显存（24GB+）
--highvram --use-sage-attention
```

各加速手段效果：

| 手段 | 加速 | 显存影响 |
|------|------|---------|
| `--xformers` | 20-35% | 降 5-10% |
| `--force-fp16` | 10-20% | 降 15-20% |
| `--use-sage-attention` | 30-50% | 降 10-15%（FLUX） |

::callout{type="warning" title="注意"}
`--xformers` + `--force-fp16` 可能让部分节点输出 NaN，全黑图时先关 `--force-fp16`。
::

## 场景模板

### 通用高质量

```ini
vo=gpu-next
hwdec=nvdec
scale=ewa_lanczossharp
linear-scaling=yes
sigmoid-upscaling=yes
video-sync=display-resample
interpolation=yes
sub-auto=fuzzy
save-position-on-quit=yes
```

### 笔记本节能

```ini
vo=gpu
hwdec=nvdec
scale=spline36
linear-scaling=no
interpolation=no
framedrop=vo
```

### 网络流

```ini
cache=yes
cache-default=100000
cache-pause-initial=yes
force-seekable=yes
ytdl-format=bestvideo[height<=?1080]+bestaudio/best
```
