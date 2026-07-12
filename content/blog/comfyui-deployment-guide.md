---
title: ComfyUI 部署与性能调优
description: ComfyUI 的部署方式、启动参数调优、显存优化、推理加速和生产配置。
date: 2024-07-18
category: engineering
tags:
  - comfyui
  - stable-diffusion
  - deployment
featured: false
draft: false
readingTime: 8 min read
---

## 硬件基线

| 显存 | SD1.5 | SDXL | SD3/FLUX | 视频模型 |
|------|-------|------|----------|---------|
| 4-6GB | ✅ | ⚠️ lowvram | ❌ | ❌ |
| 8GB | ✅ | ✅ 基础 | ⚠️ FP8 | ❌ |
| 12-16GB | ✅ | ✅ | ✅ FP8 | ⚠️ 基础 |
| 24GB+ | ✅ | ✅ | ✅ | ✅ |

## 安装

### 便携包（推荐）

下载 [ComfyUI portable](https://github.com/comfyanonymous/ComfyUI/releases)，解压双击 `run_nvidia_gpu.bat`。

### 手动

```bash
git clone https://github.com/comfyanonymous/ComfyUI.git
cd ComfyUI
python -m venv venv && source venv/bin/activate
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu124
pip install -r requirements.txt
python main.py
```

### Docker

```yaml
services:
  comfyui:
    build: .
    ports: ["8188:8188"]
    volumes:
      - ./models:/app/models
      - ./output:/app/output
    environment:
      - PYTORCH_CUDA_ALLOC_CONF=expandable_segments:True
    deploy:
      resources:
        reservations:
          devices: [{driver: nvidia, count: all, capabilities: [gpu]}]
```

## 启动参数

### 显存模式

```bash
python main.py --lowvram      # 4-6GB，逐模型加载卸载
python main.py --medvram      # 6-8GB，半卸载，推荐多数用户
python main.py                 # 8GB+ 默认
python main.py --highvram     # 24GB+ 全常驻，最快
```

### 加速

```bash
python main.py --medvram --xformers --force-fp16
python main.py --use-sage-attention   # FLUX 专用，30-50% 加速
```

| 手段 | 加速 | 显存 |
|------|------|------|
| `--xformers` | 20-35% | 降 5-10% |
| `--force-fp16` | 10-20% | 降 15-20% |
| `--use-sage-attention` | 30-50% | 降 10-15% |

::callout{type="warning" title="注意"}
`--xformers` + `--force-fp16` 可能产生 NaN 输出，全黑图时关 `--force-fp16` 测试。
::

### 网络与安全

```bash
python main.py --listen 0.0.0.0 --port 8188
python main.py --enable-auth --auth-file auth.txt
python main.py --fast     # 纯 API 模式，无 UI
```

## 性能诊断

各阶段瓶颈：

| 阶段 | 瓶颈 | 改善 |
|------|------|------|
| Prompt 编码 | CLIP/T5 | FP16 CLIP，减提示词长度 |
| Sampling | UNet | xformers、SageAttention、减步数 |
| VAE Decode | VAE | tiny VAE |
| ControlNet | 多 CN 堆叠 | 减少激活数量 |

```bash
watch -n 1 nvidia-smi        # 监控显存
```

## API 调用

```python
import requests
SERVER = "http://127.0.0.1:8188"

def queue_prompt(workflow):
    resp = requests.post(f"{SERVER}/prompt",
        json={"prompt": workflow, "client_id": "my-client"})
    return resp.json()["prompt_id"]
```

## 云端部署

RunPod / Vast.ai 选带 ComfyUI 的镜像，端口映射 8188。批量生图 4090(24GB) 性价比最高，FLUX 至少 24GB。

## 模型目录

```text
models/
├── checkpoints/     # 主模型 .safetensors
├── clip/
├── controlnet/
├── loras/
├── vae/
├── upscale_models/
└── unet/            # FLUX 拆分模型
```
