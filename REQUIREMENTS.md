# 插件合集 - 需求分析

> 每次需求变更时更新本文档。

---

## 1. 功能列表

| 功能 | 状态 |
|------|------|
| 图片提取 | 已完成 |
| 页面数据获取 | 需求分析中 |

---

## 2. 页面数据获取 - 需求分析

按 F12 五大面板逐步细分：

---

### 2.1 Elements（元素）

#### 2.1.1 DOM 树
- 所有 HTML 标签、层级结构、嵌套关系
- 文本节点（可见文本、隐藏文本、空白文本）
- 注释节点 `<!-- -->`
- Shadow DOM（`open` 模式的内部结构）
- `<template>` 标签内的文档片段
- iframe 同源内嵌文档
- 动态插入/移除的节点

#### 2.1.2 属性
- 内置属性：`id`、`class`、`href`、`src`、`alt`、`title`、`type`、`name`、`value`、`placeholder`、`selected`、`checked`、`disabled`、`readonly`
- `data-*` 自定义数据属性（完整的 `dataset` 对象）
- `aria-*` 无障碍属性
- 事件属性：`onclick`、`onsubmit` 等内联事件
- 框架属性：Vue 的 `v-*` / `:prop`、React 的 `data-reactid` / `data-reactroot`、Angular 的 `ng-*` / `_nghost-*` / `_ngcontent-*`
- 微数据属性：`itemprop`、`itemscope`、`itemtype`

#### 2.1.3 样式
- 内联 style 属性值
- Computed Style（全部 CSS 属性名 + 最终计算值）
- `window.getComputedStyle(el)` 返回的完整 CSSStyleDeclaration（几百条属性）
- 伪元素 `::before` / `::after` 的 content 和样式
- CSS 自定义变量 `var(--*)` 的实际值
- `getCSSStyleRules()` 获取匹配该元素的所有样式规则

#### 2.1.4 布局 & 几何信息
- `getBoundingClientRect()`：left、top、right、bottom、width、height、x、y
- `getClientRects()`：行内元素每行的矩形区域
- `offsetWidth/Height`、`offsetLeft/Top`、`offsetParent`
- `clientWidth/Height`、`clientLeft/Top`
- `scrollWidth/Height`、`scrollLeft/Top`
- `intersectionRatio` 可视区域交叉比

#### 2.1.5 事件监听器
- 绑定的 JS 事件类型（click、input、scroll、keydown 等数百种）
- 监听器 callback 函数体（通过 `getEventListeners()` 或调试工具）
- 捕获/冒泡阶段标识
- passive / once 标志
- 事件委托的祖先节点

#### 2.1.6 表单状态
- `<input>` 当前 value（无论类型：text、password、number、date、color...）
- `<textarea>` 当前文本
- `<select>` 选中项及所有 option
- `<form>` 表单数据 `new FormData(form)` 完整键值对
- 校验状态（`:valid`、`:invalid`、`checkValidity()`）
- 文件上传列表 `files`

#### 2.1.7 媒体状态
- `<video>` / `<audio>`：currentTime、duration、paused、buffered、playbackRate、readyState
- `<canvas>`：`toDataURL()` / `toBlob()` 当前画面
- `<img>`：naturalWidth/Height（实际尺寸）、complete（加载完毕）

#### 2.1.8 无障碍树 (Accessibility Tree)
- `role` 计算角色
- `aria-label` / `aria-labelledby` 最终名称
- `aria-describedby` 描述的文本内容
- 聚焦状态 `tabindex`
- 可聚焦元素列表

---

### 2.2 Sources（源代码）

#### 2.2.1 HTML 源码
- 主文档原始 HTML（`document.documentElement.outerHTML`）
- 每个 iframe 的独立 HTML 文档
- DOCTYPE 声明

#### 2.2.2 CSS 代码
- `<link rel="stylesheet">` 外链 CSS 文件内容
- `<style>` 内联样式块
- `CSSStyleSheet` 对象（通过 `document.styleSheets`）
  - `cssRules` 每条规则的 selectorText + style
  - `@import` 引入的子样式表
  - `@font-face` 字体声明
  - `@keyframes` 动画关键帧
  - `@media` 媒体查询条件 + 内部规则
  - `@layer` 层级规则
- 已禁用/已启用样式表

#### 2.2.3 JavaScript 代码
- `<script src="...">` 外链 JS 文件完整内容
- `<script>` 内联代码完整内容
- `type="module"` 的 ES Module 代码
- `importmap` 导入映射
- `nomodule` 降级脚本
- JSON-LD / `<script type="application/ld+json">` 结构化数据
- `<script type="application/json">` 页面初始数据

#### 2.2.4 Source Map
- `.map` 文件（编译/压缩前的原始源码 + 变量名）
- `//# sourceMappingURL=` 注释指向

#### 2.2.5 WebAssembly
- 加载的 `.wasm` 二进制模块
- 导出的 WASM 函数名和签名

#### 2.2.6 Workers
- **Dedicated Worker**：`new Worker()` 加载的独立 JS 文件
- **Shared Worker**：`new SharedWorker()` 共享 Worker
- **Service Worker**：注册的 SW 完整代码
- **Worklet**：PaintWorklet、AudioWorklet 等
- Worker 间 `postMessage` 通信

#### 2.2.7 静态资源引用
- 所有图片 URL (`<img src>`)
- 所有视频/音频 URL (`<video>`、`<audio>`)
- 所有字体 URL (`@font-face` src)
- 所有 SVG 内联图形
- ICON 图标链接（favicon、apple-touch-icon）

---

### 2.3 Network（网络）

#### 2.3.1 请求列表（每个请求包含）
- **请求 ID**：浏览器内唯一标识
- **发起时间**：精确到毫秒的时间戳
- **请求 URL**：完整地址（protocol + host + path + query + hash）
- **请求方法**：GET / POST / PUT / PATCH / DELETE / OPTIONS / HEAD
- **请求类型/资源类型**：document、script、stylesheet、image、font、media、fetch、xhr、websocket、eventsource、manifest、prefetch、preload、beacon、ping、csp_report、other
- **文档/帧 ID**：来自哪个 frame/iframe
- **Tab ID**：来自哪个标签页
- **Initiator**：调用栈/发起者（哪个文件哪一行）
- **请求大小**：头部 + 体大小（字节）
- **响应大小**：头部 + 体大小（字节，含压缩前后）

#### 2.3.2 请求头 (Request Headers)
- `:authority`、`:method`、`:path`、`:scheme`（HTTP/2 伪头）
- `Accept`、`Accept-Encoding`、`Accept-Language`
- `Authorization`（Bearer Token / Basic Auth 等）
- `Cache-Control`
- `Content-Length`、`Content-Type`
- `Cookie`（完整 cookie 串）
- `Origin`
- `Referer` / `Referrer-Policy`
- `User-Agent`
- `X-Requested-With`（AJAX 标识）
- `X-CSRF-Token` / `X-XSRF-TOKEN`
- `Sec-*` 系列安全头
- `DNT`
- **自定义头**：页面/框架注入的任何自定义 Header

#### 2.3.3 请求体 (Request Payload)
- **查询字符串** (Query String Parameters)：键值对列表
- **表单数据** (Form Data)：application/x-www-form-urlencoded
- **请求负载** (Request Payload)：JSON / XML / Plain Text / Binary
- **Multipart Form Data**：文件上传 + 字段混合
- **Blob / ArrayBuffer**

#### 2.3.4 响应数据 (Response)
- **状态码**：200、301、302、304、400、401、403、404、405、429、500、502、503 等
- **状态文本**：OK、Moved、Found、Not Modified、Unauthorized 等
- **响应头** (Response Headers)：
  - `Content-Type` + charset
  - `Content-Length`
  - `Content-Encoding`（gzip / br / deflate）
  - `Content-Disposition`
  - `Set-Cookie`（值、domain、path、expires、httpOnly、secure、sameSite）
  - `Cache-Control`、`ETag`、`Last-Modified`、`Expires`
  - `Access-Control-*` CORS 头
  - `X-Frame-Options`、`X-Content-Type-Options`、`Strict-Transport-Security` 安全头
  - `Server`、`X-Powered-By`
  - `Link`（preload、preconnect 等）
  - 自定义响应头

#### 2.3.5 响应体 (Response Body)
- **JSON 数据**：API 返回的完整 JSON
- **HTML 文档**：返回的 HTML 文本
- **CSS / JS 源码**：返回的样式和脚本文本
- **XML**：WebDAV / RSS / SOAP
- **纯文本**：TXT、CSV、JSONL
- **二进制数据**：图片（PNG/JPG/WebP）、字体（WOFF2）、视频/音频
- **Blob / ReadableStream**

#### 2.3.6 时间信息 (Timing)
- 请求开始时间
- DNS Lookup 耗时
- TCP 连接耗时（含 SSL 握手）
- Request Sent 时间点
- Waiting (TTFB) 首字节等待时间
- Content Download 下载耗时
- 队列等待时间（Queueing）

#### 2.3.7 WebSocket
- 连接 URL（`ws://` / `wss://`）
- 握手请求/响应头
- **每一条帧**：方向（发送/接收）、时间戳、数据类型（Text/Binary）、完整数据内容
- 连接关闭状态码和原因

#### 2.3.8 Server-Sent Events (SSE / EventSource)
- 事件流 URL
- **每一条事件**：id、event 类型、data 内容、retry
- 连接状态（CONNECTING / OPEN / CLOSED）

#### 2.3.9 重定向链
- 每次跳转的 URL、状态码
- 每跳的请求/响应头
- 共跳转次数

---

### 2.4 Application（应用程序）

#### 2.4.1 Storage（存储）
- **Cookies**：name、value、domain、path、expires/max-age、size、httpOnly、secure、sameSite（Strict/Lax/None）、priority、sameParty、partition key
- **localStorage**：所有 key-value 对（字符串，域名隔离）
- **sessionStorage**：所有 key-value 对（标签页隔离，关闭即清除）
- **IndexedDB**：
  - 数据库名 + 版本号
  - Object Store 名称列表
  - Index 索引列表
  - 每条记录的完整数据（键 + 值 + 主键路径）
  - 记录总数
- **Cache Storage**：缓存名 → Request → Response 键值对列表
- **Web SQL** (已废弃)：数据库名、SQL 表 → 数据行

#### 2.4.2 Service Workers
- 注册列表：scope、scriptURL、状态（parsed/installing/installed/activating/activated/redundant）
- 生命周期事件：install、activate、fetch、message、push、sync 事件
- Clients 列表：受 SW 控制的页面
- SW 内部 Cache Storage

#### 2.4.3 Web App Manifest
- PWA 清单 JSON：name、short_name、start_url、display、theme_color、background_color、icons、orientation、scope、related_applications

#### 2.4.4 Background Services
- **Background Fetch**：下载/上传 ID、资源数、状态
- **Background Sync**：注册标签、pending/触发状态
- **Notifications**：已发送通知历史
- **Payment Handler**：支付方式记录
- **Periodic Background Sync**：周期同步注册信息
- **Push Messaging**：推送订阅信息、endpoint

#### 2.4.5 Frames
- 页面中所有 frame/iframe 列表
- 每个 frame 的：名称、URL、层级深度、是否跨域
- `window.frames` 引用列表

#### 2.4.6 安全策略
- HSTS 强制 HTTPS 域名列表
- Certificate Transparency 证书透明度记录

#### 2.4.7 Trust Tokens / Private State Tokens
- 令牌颁发/赎回记录

---

### 2.5 Memory（内存）

#### 2.5.1 Heap Snapshot（堆快照）
- **所有 JS 对象**：构造器名、实例数、浅层大小、保留大小
- **对象类型分布**：
  - 字符串：数量和总占用
  - 数组：元素数量和总占用（含稀疏数组内存浪费）
  - 对象 (Object / Map / Set)
  - 闭包 (Closure)
  - DOM 节点 (HTMLDivElement、HTMLSpanElement 等)
  - 事件监听器 (EventListener)
  - Promise
  - TypedArray / ArrayBuffer
  - Error 对象
  - RegExp
  - WeakMap / WeakSet
- **按构造函数汇总**：每个"类"的实例总数和总内存
- **对象间引用关系**（Retaining Path）
- **GC Roots → 对象** 的引用链长度
- **引用计数** vs **标记清除** 各对象状态

#### 2.5.2 按距离分组
- 距离 GC Root 在 N 跳内的对象数量和内存

#### 2.5.3 Detached DOM Nodes
- 已从 DOM 树移除但 JS 仍引用的节点
- 每个分离节点的标签类型和关联数据
- 分离节点引用的子树大小
- **分离节点的 Retaining Path**：谁引用了它导致它无法被 GC

#### 2.5.4 Allocation Timeline（分配时间线）
- 按时间轴显示每个对象分配的时间点
- 哪段代码/哪个函数在持续分配内存
- 是否有内存泄漏模式（持续上升不回收）

#### 2.5.5 Allocation Profile（分配采样）
- 按函数统计：每个函数分配了多少字节、分配了多少个对象
- Top-N 内存热点函数列表

#### 2.5.6 Performance.Memory（运行时可访问）
- `usedJSHeapSize`：当前已用 JS 堆大小
- `totalJSHeapSize`：当前已分配 JS 堆总大小
- `jsHeapSizeLimit`：V8 引擎 JS 堆上限
- 每帧/定时器内存变化趋势

---

## 3. 实现分析（暂不含 Network 面板）

### 3.1 技术手段对比

实现数据提取有三种技术手段：

| 手段 | 原理 | 优势 | 劣势 |
|------|------|------|------|
| **Content Script** | `chrome.scripting.executeScript` 注入 JS 到目标页面 | 直接访问 DOM、localStorage、IndexedDB、styleSheets；无需额外权限 | 跨域样式表/脚本内容被CSSOM/CORS拦截；无法获取闭包内事件监听器 |
| **chrome.debugger (CDP)** | 通过 Chrome DevTools Protocol 连接页面 | 可获取堆快照、跨域样式表、事件监听器、完整 JS 源码 | 需要 `debugger` 权限；浏览器顶部显示"xxx正在调试此浏览器"黄色横幅 |
| **chrome.cookies API** | 扩展 API 直接查询 Cookie | 可获取包括 HttpOnly 在内的所有 Cookie | 需要 `cookies` 权限 + host_permissions |

---

### 3.2 Elements 面板数据 — 逐项实现分析

| 数据项 | 可行？ | 手段 | 说明 |
|--------|--------|------|------|
| DOM 树完整 HTML | 可行 | Content Script | `document.documentElement.outerHTML` |
| 文本节点 | 可行 | Content Script | `document.body.innerText` 或遍历 `textContent` |
| Shadow DOM (open) | 可行 | Content Script | `el.shadowRoot` 递归遍历 |
| Shadow DOM (closed) | **不可行** | — | `mode: 'closed'` 完全封闭，连 CDP 也只能看不能改 |
| iframe 同源文档 | 可行 | Content Script | `iframe.contentDocument` |
| iframe 跨域文档 | **不可行** | — | CORS 策略完全阻断 |
| 所有属性 (class/id/data-*/aria-*) | 可行 | Content Script | `el.attributes` 遍历 |
| 内联 style | 可行 | Content Script | `el.style` / `el.getAttribute('style')` |
| Computed Style (同源) | 可行 | Content Script | `getComputedStyle(el)` |
| Computed Style (跨域CSS) | **部分可行** | CDP | `CSS.getComputedStyleForNode` |
| CSS自定义变量值 | 可行 | Content Script | `getComputedStyle(el).getPropertyValue('--xxx')` |
| 布局/几何信息 | 可行 | Content Script | `getBoundingClientRect()` 等 DOM API |
| 事件监听器列表 | **部分可行** | CDP | `DOMDebugger.getEventListeners` 可获取绑定事件，但需CDP；Content Script只能读内联 `onclick` 属性 |
| 事件监听器函数体 | **部分可行** | CDP | CDP 返回 `functionLocation` + 可通过 `Debugger.getScriptSource` 获取源码 |
| 表单当前值 | 可行 | Content Script | `input.value` / `new FormData(form)` |
| 表单校验状态 | 可行 | Content Script | `el.checkValidity()` / `el.validity` |
| video/audio 播放状态 | 可行 | Content Script | HTMLMediaElement 属性 |
| canvas 当前画面 | 可行 | Content Script | `canvas.toDataURL()` |
| 无障碍树 | **部分可行** | CDP | `Accessibility.getFullAXTree` (CDP)，Content Script 只能读 aria 属性 |

### 3.3 Sources 面板数据 — 逐项实现分析

| 数据项 | 可行？ | 手段 | 说明 |
|--------|--------|------|------|
| 主文档 HTML | 可行 | Content Script | `document.documentElement.outerHTML` |
| 内联 CSS (`<style>`) | 可行 | Content Script | `style.textContent` |
| 外链 CSS (同源) | 可行 | Content Script | `style.sheet.cssRules` 或 `document.styleSheets[i].cssRules` |
| 外链 CSS (跨域) | **需CDP** | CDP | Content Script 读取跨域 CSS 会抛 SecurityError，需 `CSS.getStyleSheetText` |
| 内联 JS (`<script>`) | 可行 | Content Script | `script.textContent` |
| 外链 JS URL | 可行 | Content Script | `script.src` 拿链接 |
| 外链 JS 完整内容 (跨域) | **需CDP** | CDP | `Debugger.getScriptSource(scriptId)` |
| JSON-LD / application/json 脚本 | 可行 | Content Script | `querySelectorAll('script[type]')` |
| Source Map URL | 可行 | Content Script | 解析 JS/CSS 末尾 `//# sourceMappingURL=` |
| Source Map 文件内容 | **需CDP** | CDP | 或由 popup 直接 fetch（无CORS限制） |
| WebAssembly 模块名+导出 | 可行 | Content Script | `WebAssembly.Module.exports()` |
| WebAssembly 二进制 | **需CDP** | CDP | `Debugger.getScriptSource` |
| Worker 注册信息 | 可行 | Content Script | 只能 hook `Worker` 构造函数拿到 URL |
| Worker 内部脚本 | **不可行** | — | Worker 上下文独立，Content Script 无法注入 |
| Service Worker 注册 | 可行 | Content Script | `navigator.serviceWorker.getRegistrations()` |
| Service Worker 内部源码 | **需CDP** | CDP | `ServiceWorker.dispatchSyncEvent` 等 |
| 所有图片/媒体/字体/icon URL | 可行 | Content Script | DOM查询 + `document.styleSheets` 解析 |

### 3.4 Application 面板数据 — 逐项实现分析

| 数据项 | 可行？ | 手段 | 说明 |
|--------|--------|------|------|
| **Cookies** (非 HttpOnly) | 可行 | Content Script | `document.cookie` |
| **Cookies** (含 HttpOnly) | 可行 | chrome.cookies API | 需要 `cookies` + `host_permissions` |
| **localStorage** | 可行 | Content Script | `Object.entries(localStorage)` |
| **sessionStorage** | 可行 | Content Script | `Object.entries(sessionStorage)` |
| **IndexedDB** 数据库列表+数据 | 可行 | Content Script | `indexedDB.databases()` + 逐 store 游标遍历 |
| **Cache Storage** | 可行 | Content Script | `caches.keys()` → 逐缓存 match request |
| **Web SQL** | 可行 | Content Script | 如果有 `openDatabase` 实例，SELECT 读取 |
| **PWA Manifest** | 可行 | Content Script | `querySelector('link[rel="manifest"]')` + fetch |
| **Service Workers 注册列表** | 可行 | Content Script | `navigator.serviceWorker.getRegistrations()` |
| **SW Clients** | 可行 | Content Script | SW 内部 `clients.matchAll()` |
| **Background Fetch/Sync/Notify** | 可行 | Content Script | `navigator.serviceWorker.ready.then(sw => sw.xxx)` |
| **Frames 列表** | 可行 | Content Script | `window.frames` + `document.querySelectorAll('iframe')` |
| **Frames URL (跨域)** | **不可行** | — | 跨域 iframe 只能拿到 src 属性值，无法访问内部 |
| **HSTS / CT** | **不可行** | — | 浏览器内部安全状态，无公开 API |
| **Trust Tokens** | **不可行** | — | 无公开 API |

### 3.5 Memory 面板 — 本期不做

> 已确认：Memory 面板数据全部不在本期实现范围。

Memory 面板所有数据项（Heap Snapshot、Detached DOM Nodes、Allocation Timeline、Allocation Profile）均需 CDP，且实用价值不高，直接移除。

---

### 3.6 Network 面板 — 需求分析

#### 3.6.1 可获取的数据（对应 F12 Network 面板）

| 数据项 | 说明 |
|--------|------|
| **请求 URL** | 完整地址（protocol + host + path + query + hash） |
| **请求方法** | GET / POST / PUT / DELETE / PATCH / OPTIONS / HEAD |
| **请求头** | 全部 Headers（含 Cookie、Authorization、X-Sign、User-Agent、Referer 等） |
| **请求体** | POST/PUT 提交的 Form Data / JSON / Multipart / Blob |
| **响应头** | Content-Type、Set-Cookie、CORS 头、缓存头、Server |
| **响应体** | 返回的 JSON / HTML / XML / 文本 / Blob |
| **状态码** | 200 / 301 / 302 / 401 / 403 / 404 / 500 等 |
| **资源类型** | document / script / stylesheet / image / font / media / fetch / xhr / websocket / eventsource / prefetch |
| **时间线** | DNS、TCP、SSL、TTFB、下载耗时 |
| **发起者** | 调用栈信息（哪个文件哪一行触发） |
| **WebSocket 帧** | 每一条消息的方向、时间戳、数据内容 |
| **SSE 事件** | EventSource 推送的每一条数据 |

#### 3.6.2 对逆向的核心价值

Network 数据是**逆向中最关键的一环**，因为：
- **API 端点列表** — 自动收集所有后端接口 URL，无需手动翻源码
- **请求/响应体完整内容** — 看到真实的 JSON 数据结构
- **请求头中的签名** — `X-Sign`、`Authorization`、`X-Timestamp` 等签名头一目了然
- **Cookie 随请求的变化** — Set-Cookie 响应头暴露服务端下发的 token
- **WebSocket 消息** — 实时推送的二进制/文本数据

#### 3.6.3 三种实现方案对比

| | 方案 A：webRequest | 方案 B：前端 Hook | 方案 C：CDP |
|---|---|---|---|
| **原理** | background SW 用 `chrome.webRequest` 监听 | Content Script 劫持 `fetch` / `XMLHttpRequest` | `chrome.debugger` 挂载 CDP Network 域 |
| **捕获范围** | 所有请求（含页面加载时） | 仅 Hook 之后的请求 | 所有请求（含页面加载时） |
| **能拿到请求体** | 需要 `webRequest.onBeforeRequest` + `requestBody` | 可以（劫持时拦截 body 参数） | 可以（`Network.getResponseBody`） |
| **能拿到响应体** | 需要额外 fetch 或 CDP | 可以（劫持 then/catch） | 可以 |
| **WebSocket 帧** | **不能** | 可以（劫持 WebSocket 构造函数） | 可以 |
| **权限** | `webRequest` + `host_permissions` | 无需额外权限 | `debugger` |
| **架构变化** | **新增 background SW 文件** | 无架构变化 | **新增 background SW + CDP 逻辑** |
| **用户体验** | 无感知 | 无感知 | 黄色调试横幅 |
| **限制** | Manifest V3 下 SW 可能被休眠；不能读响应体 | 只能捕获 Hook 后的请求，错过页面初始加载 | 一次只能调试一个 tab |

#### 3.6.4 核心矛盾：Popup 生命周期 vs 持续捕获

当前架构是纯 popup + `executeScript` 注入。问题是：

| 场景 | 问题 |
|------|------|
| 用户点页面其他地方 | **Popup 自动关闭** → 注入的 content script 执行完毕就消失 |
| 用户操作页面（点击、滚动、提交表单） | Popup 已关闭，无法继续捕获 |
| SPA 内导航（如小黑盒切帖子） | `window` 对象存活，Hook 可以持续 → **SPA 没问题** |
| MPA 页面跳转（如论坛翻页） | 整个页面重载，Hook 消失 → **MPA 需要持久化方案** |

#### 3.6.5 修正方案：持久化 Hook + 回收模式

**流程设计**：

```
用户打开 Popup → 点"开始捕获"
  → 注入 hook.js（持久版，不随 executeScript 结束而消失）
  → 所有请求写入 window.__networkCapture[]
  → Popup 关闭（用户去操作页面）
  → 用户正常操作，请求持续被捕获
  → 用户重新打开 Popup
  → 点"停止并查看"
  → 注入读取脚本，拿回 window.__networkCapture
  → 展示 + 导出
```

**关键技术点**：

1. **Hook 持久化** — 不依赖 popup 生命周期：
   - 注入的 Hook 脚本用 `setInterval` 或 Event 保持引用
   - 数据存在 `window.__networkCapture`（SPA 导航不丢失）
   - 用 `chrome.storage.local` 做二级备份（每隔 N 条或每 N 秒写入一次）
   - 当前页面的 Hook 也通过 `document.addEventListener` 存活

2. **跨页面导航（MPA）**：
   - 方案 A：在 `manifest.json` 声明 `content_scripts`，页面加载时自动注入
   - 方案 B：用 `chrome.storage.local` 做缓冲，每次注入前检查是否有历史数据
   - 短期方案：SPA 场景直接用，MPA 场景提示用户 "此页面会跳转，数据可能丢失"

3. **回收数据**：
   - 用户重开 Popup → 注入 `getNetworkData.js` 读取 `window.__networkCapture`
   - 同时从 `chrome.storage.local` 合并（跨页面数据）
   - 展示在 Popup 中，支持导出

#### 3.6.6 具体实施

**新增文件**：`network-hook.js`（注入到页面的持久 Hook）

```
劫持 fetch:
  记录 { method, url, requestHeaders, requestBody, timestamp }
  → 调用原始 fetch
  → .then() 记录 { status, responseHeaders, responseBody, duration }

劫持 XMLHttpRequest:
  open → 记录 method + url
  setRequestHeader → 收集请求头
  send → 记录 body，劫持 onreadystatechange 获取响应

劫持 WebSocket:
  构造函数 → 记录 url + timestamp
  onmessage → 记录每帧 { direction: 'in', data, timestamp }
  send → 劫持记录每帧 { direction: 'out', data, timestamp }

存储:
  window.__networkCapture = { requests: [], wsFrames: [], startTime: ... }
  每 10 条请求 → chrome.storage.local.set({ __netbuf: ... })
```

**Popoup 改动**：
- 数据 Tab 顶部增加 "开始捕获" 按钮
- 点击后注入 `network-hook.js`，按钮变为 "停止捕获"
- 再次打开 Popup 时显示 "捕获中（X 条请求）"，可点 "刷新" 拉取最新数据
- 停止后数据合并到 `extract.js` 的结果中展示

**数据筛选**：
- 默认只捕获 XHR/Fetch/WS 类型，不捕获 image/css/font
- 响应体限制：JSON/Text 完整保留，Blob/Binary 只记大小
- 最大请求数：500 条（防内存溢出）

#### 3.6.7 本次实现范围

| 特性 | 本次 | 后续 |
|------|------|------|
| fetch/XHR 劫持 | ✓ | |
| WebSocket 劫持 | ✓ | |
| 请求头/体/响应头/体 完整捕获 | ✓ | |
| Popup 关闭后持续捕获 | ✓ | |
| SPA 内导航不丢失 | ✓ | |
| MPA 跨页面导航持久化 | | ✓ (需 manifest content_scripts) |
| webRequest API（不刷新全量） | | ✓ (需 background SW) |

#### 3.6.8 待确认

- [ ] 以上方案 OK？先做 SPA 持续捕获，MPA 跨页面后续再做？
- [ ] 响应体仅捕获 JSON/Text 类型，图片/视频/字体只记 URL + 大小？

---

### 3.7 本期范围确认

| 面板 | 状态 | 技术手段 | 文件 |
|------|------|----------|------|
| **Elements** | 已完成 | Content Script | `extract.js` §1 |
| **Sources** | 已完成 | Content Script | `extract.js` §2 |
| **Application** | 已完成 | Content Script | `extract.js` §3 |
| **Memory** | 不做 | — | — |
| **Network** | 后续再做 | — | — |

**技术路线**：方案一（纯 Content Script，无 CDP，无黄色横幅）

**已实现的提取项**：
- Elements: meta 标签、link 标签、标签统计、完整 HTML/文本、表单（含校验状态）、图片元素、视频/音频、Canvas、iframe、id 映射、data-* 属性汇总
- Sources: 内联/外链脚本、JSON-LD、内联/外链样式、CSS 规则（同源）、Source Map 引用、所有资源 URL 汇总
- Application: localStorage、sessionStorage、Cookies (非HttpOnly)、IndexedDB（数据库+对象存储列表）、Cache Storage（缓存名+条目列表）、Service Worker 注册信息、PWA Manifest、window 自定义属性、框架全局状态（`__NUXT__`、`__NEXT_DATA__` 等）

**UI 改动**：
- 新增标签栏 [图片 | 数据]
- 数据标签页：提取按钮 → 树形折叠结果 → 导出 JSON
- 弹窗宽度 480px（原 420px）
- 权限未变：`storage`、`activeTab`、`scripting`、`downloads`

---

---

---

## 4. 小黑盒签名算法逆向（实战案例）

> 目标：`https://www.xiaoheihe.cn/bbs/post_share`
> 源码：`index-FrjtY7ot.js` (747KB, Vite 打包)
> 日期：2026-05-29

### 4.1 架构概览

小黑盒使用**双层加密**：

| 层 | 函数 | 算法 | 用途 |
|----|------|------|------|
| **Body 加密** | `J5` / `e7` | AES-CBC + RSA-1024 + MD5 | 加密请求体 |
| **Header 签名** | `pt` (CreateHkey) | MD5 + 自定义 XOR 链 + 字符映射 | 生成 hkey 请求头 |

### 4.2 Body 加密层（J5 / e7）

#### RSA 公钥（硬编码）

```
-----BEGIN PUBLIC KEY-----
MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDZgjVwAiKTjZ55nG+mW6r3TSU4
ECvNYqDMIS/bhCj2QaH5GI/KZb2TBp+CBvUj9SLFnmJQ0kzHzHoGZCQ88VevCffF
7JePGF9cmKQqotlfTKbV4oxV5iLz7JSG6b/Vg7AXtrTolNtWsa8HiB0tI0YClYaQ
lOXm4UxLeSxQwSFETwIDAQAB
-----END PUBLIC KEY-----
```

参数：RSA-1024, e=65537

#### 签名流程

```
请求参数 JSON
  ↓ [1] Ib() 生成随机 16 字节 AES Key（96 字符集）
  ↓ [2] uE() AES-128-CBC 加密参数（固定 IV: "abcdefghijklmnop"）
  ↓ [3] s_() RSA-1024 公钥加密 AES Key
  ↓ [4] MD5(加密数据 + 时间戳) + MD5(加密Key)
  ↓
{ sid, key, data } → 请求体
```

#### 核心函数

| JS 函数 | 作用 | 细节 |
|---------|------|------|
| `Ib()` | 随机 Key | 16 chars, 96 ASCII 字符集, ~104 bits 熵 |
| `uE(data, key)` | AES-128-CBC | IV = `"abcdefghijklmnop"`（固定） |
| `s_(key)` | RSA-1024 加密 | 公钥硬编码，打印 `[browser]` 调试日志 |
| `QC` | JSEncrypt 实例 | jsencrypt@3.3.2 |
| `Ct` | CryptoJS 库 | AES + MD5 |
| `J5(e, t)` | 签名函数 | `t` 控制 MD5 拼接顺序 |
| `e7(e, t)` | 签名函数(gzip) | 先用 Q5 压缩再加密，返回 `{sid,key,data,time}` |

### 4.3 Header 签名层（pt / CreateHkey）

#### 算法流程

```
path = "/bbs/app/api/link/post"
time = Unix 秒级时间戳
nonce = MD5(time + random).toUpperCase()

  ↓
[1] str1 = av(String(time), "AB45STUVWZ...LMN89", -2)   // 时间映射
[2] str2 = sv(path, charset)                             // 路径映射
[3] str3 = sv(nonce, charset)                            // nonce 映射
[4] merged = oM([str1, str2, str3]).slice(0, 20)         // 简单 zip 交错
[5] hash = MD5(merged)                                   // MD5 哈希
[6] last6 = hash.slice(-6) → 转 ASCII 码                 // 取后 6 位
[7] mixed = Km(last6)                                    // XOR 块变换
[8] checksum = sum(mixed) % 100                          // 两位校验和
[9] prefix = av(hash.substring(0,5), charset, -4)        // 前 5 位映射
  ↓
hkey = prefix + checksum  →  7 个字符
```

#### 核心函数对照

| 语义名 | JS 原始名 | 作用 |
|--------|-----------|------|
| `Vm` | `_h` | 位变换: `(e<<1) ^ 27` if bit 7 set |
| `qm` | `Yi` | `_h(e) ^ e` |
| `$m` | `Go` | `Yi(_h(e))` |
| `Ym` | `Xs` | `Go(Yi(_h(e)))` |
| `Gm` | `Vl` | `Xs ^ Go ^ Yi` |
| `Km` | `iM` | 4 字节块变换（XOR 轮转矩阵） |
| `av` | `Hg` | 字符映射 (slice) |
| `sv` | `Ng` | 字符映射 (simple) |
| `CreateNewStr` | `oM` | **简单 zip 交错**（非排序） |
| `CreateHkey` | `pt` | 主签名函数 |

#### 字符集

```
"AB45STUVWZEFGJ6CH01D237IXYPQRKLMN89"
```

#### 时间容差

```javascript
qg = {
  a: (e,t,n) => pt(e, t-1, n),  // -1s
  b: (e,t,n) => pt(e, t-2, n),  // -2s
  ...
  f: (e,t,n) => pt(e, t, n),    //  0s
  g: (e,t,n) => pt(e, t+1, n),  // +1s
  ...
};
```

服务端在 ±5 秒窗口内验证。

### 4.4 逆向方法论

#### 成功路径：搜 `setPublicKey`

RSA 公钥在代码中非常显眼（`-----BEGIN PUBLIC KEY-----`），顺藤摸瓜找到 `J5`/`e7`。

#### 遗漏点：搜 `Ct.MD5` 或 `MD5(`

`pt`（header 签名）完全不用 RSA，只依赖 MD5 + 自定义 XOR 链 + 字符映射表。在压缩 JS 中：
- 函数名是 2 字母（`pt`、`Hg`、`Ng`），混在几万个变量中
- 没出现 `sign`/`hmac`/`encrypt`/`key` 等关键词
- 字符集 `"AB45STUVWZ..."` 和 `setPublicKey` 隔了 17 万字符，是完全不同的代码区域

**教训**：搜 RSA 公钥只能找到 body 加密层；要找到 header 签名层需要搜 `MD5(` 遍历所有哈希调用点。

### 4.5 安全隐患总结

| 问题 | 位置 | 影响 |
|------|------|------|
| AES IV 固定 | `uE()` | 削弱 CBC 安全性 |
| RSA 仅 1024 位 | `s_()` | 安全性不足 |
| MD5 签名 | 两层都有 | 存在碰撞风险 |
| 调试日志 | `s_()` 打印 `[browser]` | 信息泄露 |
| 字符集固定 | `pt()` | 缩小暴力搜索空间 |

---

## 5. 设备指纹配置（portal101.cn / 数美）

```javascript
window._smConf = {
  organization: "0yD85BjYvGFAvHaSQ1mc",
  appId: "heybox_website",
  publicKey: "MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQCXj9exmI4nQjmT52iwr+yf7hAQ06bfSZHTAHUfRBYiagCf/whhd8es0R79wBigpiHLd28TKA8b8mGR8OiiI1hV+qfynCWihvp3mdj8MiiH6SU3lhro2hkfYzImZB0RmWr2zE4Xt1+A6Oyp6bf+W7JSxYUXHw3nNv7Td4jw4jEFKQIDAQAB",
  staticHost: "static.portal101.cn",
  protocol: "https"
};
```

设备指纹由 `fp.min.js` 采集，RSA 公钥 #2 加密后上报。

---

---

## 6. VS Code 插件 — 打字连击追踪

### 6.1 功能描述

打字节奏追踪器：记录连续击键，5 秒内敲下视为连击继续，超时断开。

### 6.2 显示设计

状态栏右端显示：

```
⚡ 25 [B] ████████████░░░░░░░░
  ↑      ↑            ↑
 连击数 等级    进度条(从右消失)
```

- 进度条 20 块，每 250ms 消去一块 = 5 秒总时长
- 满块 `█` 白色 → 每 250ms 从右端消去一个变 `░` 灰色
- 每次打字重置为满

### 6.3 连击等级（可配置）

| 等级 | 默认阈值 | 状态栏颜色 |
|------|----------|------------|
| SSS | 500+ | 金色 #FFD700 |
| SS  | 200+ | 红色 |
| S   | 100+ | 橙色 |
| A   | 60+  | 紫色 |
| B   | 30+  | 蓝色 |
| C   | 15+  | 绿色 |
| D   | 5+   | 灰色 |

### 6.4 交互

| 操作 | 说明 |
|------|------|
| 点击状态栏 | 重置连击数 |
| `Ctrl+Shift+P` → 打字连击: 开关 | 启用/禁用 |
| `Ctrl+Shift+P` → 打字连击: 重置 | 手动重置 |
| 配置项 | `typingCombo.timeout` / `thresholdD` ~ `thresholdSSS` |

### 6.5 已实现 ✓

---

## 7. 变更记录

| 日期 | 变更内容 |
|------|----------|
| 2026-05-28 | 初始化项目，图片提取功能完成 |
| 2026-05-28 | 补充五大面板全量数据细分分析 |
| 2026-05-28 | 补充实现分析（可行性 + 技术手段 + 权限需求） |
| 2026-05-28 | 确认范围：Elements + Sources + Application 本期实现；Memory 不做；Network 后续 |
| 2026-05-28 | 实现：extract.js 数据提取脚本 + popup 数据标签页 UI |
| 2026-05-28 | 新增：重点数据自动识别 + "仅看重点"过滤模式 |
| 2026-05-28 | 优化：重点数据摘要可点击跳转到树中对应位置，自动展开+闪烁高亮 |
| 2026-05-28 | 新增：Network 面板前端 Hook 捕获（fetch/XHR/WebSocket） |
| 2026-05-29 | 实战：小黑盒签名算法完整逆向（Body AES+RSA + Header MD5+XOR 双层） |
