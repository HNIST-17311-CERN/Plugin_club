# 浏览器插件 - 需求分析

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

### 3.6 Network 面板 — 暂不实现

> 已确认：Network 面板本期先不做，后续再写。

原因：webRequest 拦截需要 background service worker 驻留 + host_permissions，架构上与当前纯 popup + content script 模式不同，单独排期。

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

## 4. 变更记录

| 日期 | 变更内容 |
|------|----------|
| 2026-05-28 | 初始化项目，图片提取功能完成 |
| 2026-05-28 | 补充五大面板全量数据细分分析 |
| 2026-05-28 | 补充实现分析（可行性 + 技术手段 + 权限需求） |
| 2026-05-28 | 确认范围：Elements + Sources + Application 本期实现；Memory 不做；Network 后续 |
| 2026-05-28 | 实现：extract.js 数据提取脚本 + popup 数据标签页 UI |
