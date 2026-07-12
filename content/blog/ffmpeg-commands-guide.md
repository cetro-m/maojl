---
title: FFmpeg 命令实战：常用场景速查
description: 按场景分类的 FFmpeg 命令——格式转换、裁剪、压缩、拼接、提取音频、截图、滤镜。
date: 2024-06-06
category: engineering
tags:
  - ffmpeg
  - video
  - audio
featured: false
draft: false
readingTime: 8 min read
---

FFmpeg 命令基本结构：`ffmpeg [全局参数] -i [输入] [输出参数] [输出文件]`。输出参数必须写在输出文件名之前。大部分参数可用 `ffmpeg -h encoder=libx264` 查文档。

## 格式转换

```bash
# 容器转换（不重新编码）
ffmpeg -i input.mp4 -c copy output.mkv
ffmpeg -i input.mov -c copy output.mp4

# 编码转换（H.264 + AAC，最兼容）
ffmpeg -i input.mkv -c:v libx264 -c:a aac output.mp4

# HEVC（压缩率更高）
ffmpeg -i input.mp4 -c:v libx265 -c:a aac output_hevc.mp4

# 批量 mp4 → mkv
for f in *.mp4; do ffmpeg -i "$f" -c copy "${f%.mp4}.mkv"; done
```

## 裁剪

```bash
# 时间裁剪（关键帧快速定位）
ffmpeg -ss 00:00:30 -i input.mp4 -t 10 -c copy clip.mp4

# 精确到帧（重新编码）
ffmpeg -i input.mp4 -ss 00:00:30 -t 10 -c:v libx264 -c:a aac clip.mp4
```

::callout{type="warning" title="注意"}
`-ss` 在 `-i` 之前用关键帧定位（快但不精确），之后逐帧解码（精确但慢）。
::

```bash
# 画面裁切 crop=宽:高:起始x:起始y
ffmpeg -i input.mp4 -vf "crop=1280:720:200:100" output.mp4

# 缩放到 720p，保持宽高比
ffmpeg -i input.mp4 -vf "scale=-1:720" output_720p.mp4

# 缩放到 50%
ffmpeg -i input.mp4 -vf "scale=iw/2:ih/2" output_half.mp4
```

## 音频提取与替换

```bash
# 提取 MP3
ffmpeg -i input.mp4 -vn -c:a libmp3lame -b:a 192k output.mp3

# 提取 AAC
ffmpeg -i input.mp4 -vn -c:a aac -b:a 128k output.m4a

# 提取 WAV
ffmpeg -i input.mp4 -vn -c:a pcm_s16le output.wav

# 去掉音频
ffmpeg -i input.mp4 -an -c:v copy silent.mp4

# 替换音频轨
ffmpeg -i input.mp4 -i audio.mp3 -c:v copy -c:a aac -map 0:v:0 -map 1:a:0 -shortest output.mp4
```

## 压缩

```bash
# CRF 质量模式（0-51，越小越好，推荐 18-28）
ffmpeg -i input.mp4 -c:v libx264 -crf 23 -c:a aac output.mp4
ffmpeg -i input.mp4 -c:v libx265 -crf 28 -c:a aac output.mp4

# 固定码率
ffmpeg -i input.mp4 -c:v libx264 -b:v 1M -c:a aac -b:a 128k output.mp4

# 两遍编码（最大压缩率）
ffmpeg -i input.mp4 -c:v libx264 -b:v 1M -preset slow -pass 1 -an -f null /dev/null
ffmpeg -i input.mp4 -c:v libx264 -b:v 1M -preset slow -pass 2 -c:a aac output.mp4
```

CRF 是首选，两遍编码只对固定码率有效。

## 拼接

同格式（编码参数一致）用 concat demuxer，无需重新编码：

```bash
# filelist.txt:
# file 'clip1.mp4'
# file 'clip2.mp4'

ffmpeg -f concat -safe 0 -i filelist.txt -c copy merged.mp4
```

不同格式先统一转码再拼。

## 截图

```bash
# 取单帧
ffmpeg -ss 00:01:00 -i input.mp4 -vframes 1 thumb.jpg

# 每隔 30 秒一张
ffmpeg -i input.mp4 -vf "fps=1/30" thumb_%03d.jpg

# 3x3 缩略图平铺
ffmpeg -i input.mp4 -vf "fps=1/30,tile=3x3" preview.jpg

# 查看媒体信息
ffprobe -v quiet -print_format json -show_format -show_streams input.mp4
```

## 滤镜

```bash
# 文字水印
ffmpeg -i input.mp4 -vf "drawtext=text='DEMO':fontsize=36:fontcolor=red:x=w/2-text_w/2:y=h/2" output.mp4

# 图片水印（右上角）
ffmpeg -i video.mp4 -i logo.png -filter_complex \
  "[1:v]scale=iw*0.1:-1[logo];[0:v][logo]overlay=W-w-10:10" -c:a copy output.mp4

# 2 倍速
ffmpeg -i input.mp4 -filter_complex "[0:v]setpts=0.5*PTS[v];[0:a]atempo=2.0[a]" -map "[v]" -map "[a]" output.mp4

# 慢动作 0.5x
ffmpeg -i input.mp4 -filter_complex "[0:v]setpts=2.0*PTS[v];[0:a]atempo=0.5[a]" -map "[v]" -map "[a]" output.mp4
```

## GPU 加速

```bash
# NVIDIA NVENC
ffmpeg -i input.mp4 -c:v h264_nvenc -preset p4 -b:v 5M output.mp4

# 列出可用硬件编码器
ffmpeg -encoders | grep -E "(nvenc|vaapi|qsv|videotoolbox)"
```

硬件编码快但同码率下画质略低，适合批量转码和直播。

## 常见坑

- **参数顺序**：输出参数（`-b:v`、`-c:v`）必须写在输出文件名之前
- **音频不同步**：`-c copy` 裁剪时，重新编码可解决
- **覆盖确认**：`-y` 自动覆盖，`-n` 跳过已有
- **快速测试**：`-t 10` 只处理前 10 秒
