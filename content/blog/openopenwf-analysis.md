---
title: OpenWF Enabler：C++ API Hook 实现游戏流量重定向
description: 拆解 OpenWF Enabler 的技术实现——Win32 DLL 注入、MinHook API 拦截、SSL 证书绕过、内存签名扫描。
date: 2021-10-15
category: engineering
tags:
  - cpp
  - reverse-engineering
  - windows
  - hook
  - warframe
featured: false
draft: false
readingTime: 10 min read
---

## 背景

[OpenWF](https://openwf.io/) 是 Warframe 私服项目。原版启动器用 WinDivert 在网络驱动层拦截流量。OpenWF Enabler 是替代方案：**用户态 DLL 注入 + API Hook**，不依赖驱动。

项目三个组件：

```text
openopenlauncher.exe  ── Win32 GUI 启动器（选 Warframe 路径、语言、注入 DLL）
openopenwf.dll        ── 核心重定向模块（注入到 Warframe 进程）
openopenclr.dll (C#)  ── 可选调试检查器
```

注入流程：挂起创建 Warframe 进程 → `VirtualAllocEx` 写入 DLL 路径 → `CreateRemoteThread` 调 `LoadLibraryW` 加载 DLL → Hook 主线程入口点完成初始化。

## 入口点 Hook

DllMain 限制严格，不能做大部分初始化。项目在 DllMain 中劫持 PE 入口点，让初始化代码在主线程上下文中执行：

```cpp
static void HookEntryPoint()
{
    PIMAGE_DOS_HEADER hdr = (PIMAGE_DOS_HEADER)GetModuleHandleA(nullptr);
    PIMAGE_NT_HEADERS64 nt = (PIMAGE_NT_HEADERS64)((char*)hdr + hdr->e_lfanew);
    g_entryPointAddress = (char*)hdr + nt->OptionalHeader.AddressOfEntryPoint;
    // 覆盖入口点为 jmp → trampoline → HookedEntryPoint
    memcpy(g_entryPointAddress, entryPointOverwriteBytes, sizeof(entryPointOverwriteBytes));
}
```

`HookedEntryPoint` 执行 LoadConfig → PlaceHooks → InitCLR，然后恢复原始入口点，让游戏继续启动。

## MinHook API 拦截

项目用 [MinHook](https://github.com/TsudaKageyu/minhook) 在系统调用层拦截网络请求，重定向到本地 OpenWF 服务器。

### DNS 劫持

```cpp
static INT WSAAPI NEW_getaddrinfo(PCSTR pNodeName, ...)
{
    if (pNodeName) {
        std::string url = pNodeName;
        for (auto& c : url) c = std::tolower(c);
        if (url.find("warframe") != std::wstring::npos)
            return OLD_getaddrinfo(g_Config.serverHost.c_str(), ...);
    }
    return OLD_getaddrinfo(pNodeName, ...);
}
```

`getaddrinfo` 和 `GetAddrInfoExW` 同时 Hook，域名含 "warframe" 时解析到 `serverHost`（默认 127.0.0.1）。

### SSL 绕过

```cpp
static int NEW_X509_verify_cert(void* ctx) { return 1; }
static int NEW_Curl_ossl_verifyhost(void* ctx) { return 0; }
static int NEW_WorldStateVerify(void* a1, void* a2) { return 1; }
```

直接返回成功，跳过证书校验和世界状态签名验证。

### AES 密钥劫持

Warframe 部分请求用随机 AES-192 密钥加密，RSA 公钥加密传输。Hook RSA 函数，替换密钥为已知值：

```cpp
static int NEW_rsa_ossl_public_encrypt(int flen, unsigned char* from, ...)
{
    if (flen == 40 && padding == 4) { // IV(16) + Key(24)
        memset(from, 0x41, flen);    // → AAAAAAAAAAAAAAAAAAAA...
        memset(to, 0x41, 128);
        return 128;
    }
    return OLD_rsa_ossl_public_encrypt(flen, from, to, rsa, padding);
}
```

OpenWF 服务器用已知密钥 `AAAAAAAAAAAAAAAAAAAAAAAA`（Key）+ `AAAAAAAAAAAAAAAA`（IV）解密。

### 请求 URL 修改

拦截 SendPostRequest / SendGetRequest，替换域名并附加 OpenWF 参数（buildLabel、clientMod）。

## 内存签名扫描

Warframe 更新会改变函数地址。项目用特征码扫描在内存中定位目标函数：

```cpp
std::vector<unsigned char*> SignatureScan(const char* pattern, const char* mask,
    unsigned char* data, size_t length)
{
    std::vector<unsigned char*> results;
    for (size_t i = 0; i < length - strlen(pattern); ++i) {
        bool match = true;
        for (size_t j = 0; j < strlen(pattern); ++j)
            if (mask[j] == 'x' && data[i+j] != (unsigned char)pattern[j])
                { match = false; break; }
        if (match) results.push_back(data + i);
    }
    return results;
}
```

`PlaceHooks()` 中进行近 20 次签名扫描。`x` 表示精确匹配，`?` 通配。

## CLR Inspector

C++ 进程内宿主 .NET 运行时，运行 C# 检查器，通过原生事件队列通信。可查看 Warframe 对象类型列表、类型属性、继承关系。

## 稳定性

- 启动时验证进程名是否为 `Warframe.x64.exe`
- 签名扫描失败时 `FATAL_EXIT` 明确报错
- 函数地址对齐到 `0x...0` 边界防止 Hook 越界

```cpp
#define FATAL_EXIT(s) OpenWFFatalExit(s, __FUNCTION__, __FILE__, __LINE__)
```

## 注意事项

::callout{type="warning" title="合规"}
私服与进程注入工具仅用于学习研究。使用前阅读 Digital Extremes 服务条款。
::

- 支持 Warframe 42.0+，更新后可能需要更新特征码
- 不可与官方 OpenWF Bootstrapper 共存
- 仅支持请求重定向，不支持脚本/内容修改
- 需同时部署 OpenWF 服务器实例

项目地址：[github.com/mskimi7/openopenwf](https://github.com/mskimi7/openopenwf)
