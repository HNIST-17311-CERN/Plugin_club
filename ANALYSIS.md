# pageData JSON 字段分析

> 分析对象：`pageData_湖南理工大学.json`（来源 `https://www.hnist.cn/`）
> 目标：理解每个字段的含义，并注出对逆向工程有价值的部分。

---

## 一、JSON 顶层结构

```json
{
  "_debug":     {},  // 提取过程的调试日志
  "pageInfo":   {},  // 页面基本信息
  "elements":   {},  // Elements 面板数据
  "sources":    {},  // Sources 面板数据
  "application":{}   // Application 面板数据
}
```

---

## 二、pageInfo — 页面基本信息

| 字段 | 示例值 | 含义 | 逆向价值 |
|------|--------|------|----------|
| `title` | `"湖南理工大学"` | 页面标题 `<title>` | 低 — 仅用于识别站点名称 |
| `url` | `"https://www.hnist.cn/"` | 当前页面完整 URL | 中 — 确定目标站点根域名 |
| `domain` | `"www.hnist.cn"` | 主机名 | 中 — 识别子域名范围 |
| `protocol` | `"https:"` | 协议 | 低 |
| `referrer` | `"https://cn.bing.com/"` | 来源页面 | 中 — 可知道用户从哪跳转来的 |
| `charset` | `"UTF-8"` | 字符编码 | 低 |
| `readyState` | `"complete"` | 页面加载状态 | 低 |
| `lastModified` | `"05/28/2026 11:46:49"` | 文档最后修改时间 | 低 |

---

## 三、elements — 页面元素

### 3.1 elements.meta — `<meta>` 标签

| 键 | 值 | 含义 | 逆向价值 |
|----|-----|------|----------|
| `keywords` | `"湖南理工大学，湖南理工"` | SEO 关键词 | **高** — 暴露站点主题、业务关键词 |
| `viewport` | `"width=device-width, initial-scale=1..."` | 移动端适配 | 低 |
| `charset` | `"UTF-8"` | 编码 | 低 |

### 3.2 elements.links — `<link>` 标签

| 关键发现 | 含义 | 逆向价值 |
|-----------|------|----------|
| `css/reset.css?t=0507` | 样式文件，`?t=0507` 是缓存版本号 | 低 |
| `_sitegray/_sitegray_d.css` | **Visual SiteBuilder CMS 专用样式** | **高** — 识别 CMS 厂商 |
| `index.vsb.css` | VSB = Visual SiteBuilder | **高** — 确认 CMS |
| `images/favicon.ico` | 网站图标 | 低 |

**结论**：该站使用 **北京通元 Visual SiteBuilder**（网站群管理系统）。

### 3.3 elements.tagCounts — 标签统计

| 标签 | 数量 | 含义 | 逆向价值 |
|------|------|------|----------|
| `a` | 117 | 链接数量 | 中 — 反映页面信息密度 |
| `div` | 182 | 容器数量 | 低 |
| `script` | 26 | 脚本标签数 | **高** — 脚本多意味着复杂逻辑 |
| `li` | 94 | 列表项 | 低 |
| `img` | 28 | 图片数量 | 中 — 对应图片提取量 |
| `form` | 1 | 表单数量 | **高** — 有一个搜索表单 |
| `h4` | 33 | 四级标题 | 中 — 对应新闻文章标题数 |

### 3.4 elements.forms — 表单

**搜索表单** `#au1a`：

| 属性 | 值 | 含义 | 逆向价值 |
|------|-----|------|----------|
| `action` | `search.jsp?wbtreeid=1001` | 搜索接口 | **高** — 后端 JSP 页面 |
| `method` | `POST` | POST 提交 | **高** — 确认搜索请求方式 |
| `name` | `au1a` | 表单名 | 低 |
| 隐藏字段 `lucenenewssearchkey` | Base64 编码关键词 | **Lucene 搜索引擎** | **很高** — 确认使用 Lucene 全文检索 |
| 隐藏字段 `_lucenesearchtype` | `"1"` | 搜索类型参数 | **高** — 请求参数 |
| 隐藏字段 `searchScope` | `"0"` | 搜索范围 | 中 |
| 可见字段 `showkeycode` | 占位 "全文搜索" | 搜索关键词输入 | 中 |

**关键发现**：搜索功能使用 **Apache Lucene**，通过 POST → `search.jsp`，关键词经 Base64 编码后发 `lucenenewssearchkey`。

### 3.5 elements.idMap — 页面中所有 id

| id | 标签 | 含义 | 逆向价值 |
|----|------|------|----------|
| `app` | `div` | Vue/应用容器 | 中 |
| `au1a` | `form` | 搜索表单 | 高 |
| `lucenenewssearchkey1124467` | `input` | Lucene 搜索关键词隐藏字段 | **很高** |
| `showkeycode1124467` | `input` | 搜索输入框 | 高 |
| `_vsbscreen` | `script` | VSB 响应式探测脚本 | 中 |
| `immersive-translate-popup` | `div` | 沉浸式翻译插件注入 | 低 — 第三方 |

### 3.6 elements.images — 图片汇总

共 28 张图片，可分类为：

| 类别 | 数量 | 示例路径 | 逆向价值 |
|------|------|----------|----------|
| 导航配图 | 6 | `images/nav-pic-xxgk.png` | 低 |
| 新闻配图 | 9 | `__local/.../xxx.jpg` | 中 — 可抓取新闻素材 |
| 专栏图标 | 6 | `__local/.../xxx.jpg` | 低 |
| 二维码 | 3 | `images/weibocode.jpg` | 低 |
| Logo | 2 | `images/logo.png` | 低 |

`__local/` 路径模式揭示静态文件存储在 CMS 的本地文件系统中。

### 3.7 elements.documentHTML / bodyText

| 字段 | 内容 | 逆向价值 |
|------|------|----------|
| `documentHTML` | 完整页面 HTML（约 30KB） | **很高** — 可直接分析所有硬编码的信息 |
| `bodyText` | 页面可见文本 | **很高** — 暴露组织结构、联系方式、近期活动等情报 |

bodyText 暴露的关键信息：
- 电话 `0730-8640001`、邮箱 `dzb@hnist.edu.cn`
- 备案号 `湘ICP备05003891号`
- 近期新闻标题（领导视察、会议、活动）
- 招聘公告（教师招聘、高层次人才引进）

---

## 四、sources — 源代码

### 4.1 sources.externalScripts — 外链 JS 文件

| JS 文件 | 用途 | 逆向价值 |
|---------|------|----------|
| `js/jquery.min.js` | jQuery | 低 |
| `js/swiper.min.js` | Swiper 轮播图 | 低 |
| `js/aos.js` | AOS 滚动动画 | 低 |
| `js/anime.min.js` | 动画库 | 低 |
| `js/script.js` | **自定义主脚本** | **很高** — 核心业务逻辑 |
| `js/lib.js` | 自定义工具库 | 很高 |
| `js/app.js` | 自定义应用代码 | 很高 |
| `_sitegray/_sitegray.js` | VSB CMS 变灰功能 | 中 |
| `system/resource/js/vsbscreen.min.js` | VSB 响应式探测 | 中 |
| `system/resource/js/counter.js` | 访问计数器 | 中 — 可分析统计机制 |
| `system/resource/js/dynclicks.js` | **VSB 动态点击统计** | **高** — 可追踪用户行为 |
| `system/resource/js/base64.js` | Base64 编码库 | 中 — 用于搜索关键词编码 |
| `system/resource/js/formfunc.js` | VSB 表单处理 | 高 |
| `system/resource/js/ajax.js` | VSB AJAX 封装 | **很高** — 可分析 JS 端 API 调用逻辑 |
| `system/resource/js/centerCutImg.js` | VSB 图片裁剪 | 低 |
| `system/resource/js/openlink.js` | VSB 链接管理 | 中 |

### 4.2 sources.inlineScripts — 内联 JS

| 行数 | 内容 | 逆向价值 |
|------|------|----------|
| `_jsq_(1001,'/index.jsp',-1,2051977945)` | **初始化计数器**，参数：站点ID=1001，页面=/index.jsp，用户ID=2051977945 | **很高** — 暴露站点内部 ID、用户 ID |
| `_nl_ys_check()` | 搜索表单校验 + **Base64 编码关键词** | **很高** — 搜索请求构造逻辑 |
| `_showDynClickBatch(...)` × 7 | 批量提交点击统计 | **高** — 每个新闻链接的 dynclick ID 都暴露了 |

**`_showDynClickBatch` 暴露的新闻/文章 ID 列表**：

| 区块 | 文章 IDs |
|------|----------|
| 轮播图 (u6) | 2259, 3021, 2799, 2557, 1910 |
| 头条 (u7) | 3024 |
| 理工要闻 (u8) | 2301, 2410, 3025, 3010, 3009, 3007, 3002, 2989, 2987 |
| 综合新闻 (u9) | 3041, 3026, 3012, 3006, 3005, 3004, 2985, 2986 |
| 学术动态 (u10) | 2975, 2974, 2973, 2955, 2953, 2950, 2939, 2932 |
| 通知公告 (u11) | 2984, 2907, 2886, 2840, 2766, 2683, 2682, 2681 |
| 专题专栏 (u12) | 2545, 1850, 1851, 2011, 1853, 2836 |

**`_jsq_()` 暴露的关键参数**：
- 站点 ID：`1001`
- 当前页面：`/index.jsp`
- 用户标识：`2051977945`

### 4.3 sources.cssRules — CSS 规则

8 个样式表共数百条规则。逆向关键点：

| 发现 | 含义 | 逆向价值 |
|------|------|----------|
| `@font-face { src: url("../fonts/hnist-fzxbs.woff"); }` | 学校专用字体 | 低 |
| 主题色 `rgb(103, 20, 130)`（紫色） | 学校品牌色 | 低 |
| `.wp { max-width: 14.6rem; }` | 响应式断点 | 低 |

### 4.4 sources.resourceURLs — 资源 URL 汇总

| 类型 | 数量 | 逆向价值 |
|------|------|----------|
| `favicons` | 1 | 低 |
| `fonts` | 2 (`.woff`) | 低 |
| `images` | 26 | 中 — 可批量下载所有图片 |

### 4.5 sources.sourceMaps — Source Map

| 发现 | 逆向价值 |
|------|----------|
| `vsbscreen.min.js` 有 `.min` 后缀，同路径可能存在 `.map` 文件 | **高** — 如果有 `.map`，可还原 VSB 源码 |

---

## 五、application — 应用程序存储

### 5.1 application.cookies

```
LOGIN=3134323334383032313538; 
SCREEN_NAME=6962426136725567534f4a4d4e57615876634a4b6e673d3d
```

| Cookie | 值 | 含义 | 逆向价值 |
|--------|-----|------|----------|
| `LOGIN` | `3134323334383032313538` | Hex → ASCII = `14234802158`（**登录账号/学号**） | **极高** — 暴露当前用户登录身份 |
| `SCREEN_NAME` | `696242613672...` | Base64 → ?（可能是加密的用户名） | **极高** — 用户身份 token |

### 5.2 application.sessionStorage

| 键 | 值 | 含义 | 逆向价值 |
|----|-----|------|----------|
| `__imt_handshake_page_id` | `a2617dce-...` | 沉浸式翻译插件的页面标识 | 低 |

### 5.3 application.localStorage

为空 — 该页面不使用 localStorage。

### 5.4 application.indexedDB / cacheStorage / serviceWorkers / manifest

全部为空 — 该页面不使用这些前端存储或 PWA 特性。

### 5.5 application.globalStates — 框架全局状态

| 变量 | 内容 | 逆向价值 |
|------|------|----------|
| `app` | `{}` 空对象 | 低 — Vue 实例已挂载但内部状态不可枚举 |
| `__REACT_DEVTOOLS_GLOBAL_HOOK__` | 未出现 | 确认非 React 项目 |

---

## 六、逆向工程综合评分

### 6.1 对该站点的逆向价值总结

| 数据类别 | 价值等级 | 具体收获 |
|----------|----------|----------|
| **Cookie** | **极高** | 获取了当前登录用户的账号（`14234802158`）和加密用户名，可直接用于会话劫持测试 |
| **CMS 识别** | **高** | 确认是北京通元 Visual SiteBuilder + Lucene 搜索 |
| **内联 JS 参数** | **高** | 获取站点 ID(1001)、新闻/文章 ID 列表、计数器用户标识 |
| **搜索接口** | **高** | POST `search.jsp?wbtreeid=1001`，关键词 Base64 编码 |
| **自定义 JS 文件** | **高** | `script.js`、`lib.js`、`app.js` 包含核心业务逻辑，可进一步下载分析 |
| **图片** | 中 | 28 张可下载图片 |
| **页面文本** | 中 | 暴露了联系方式、组织结构、近期招聘信息 |
| **CSS/布局** | 低 | 仅用于前端样式还原 |
| **localStorage/IDB** | 无 | 该页面不使用 |

### 6.2 通用来看各字段的逆向价值

| 字段类别 | 能提供什么 | 典型逆向用途 |
|----------|------------|--------------|
| `pageInfo` | 站点域名、标题 | 确定目标范围 |
| `elements.meta` | SEO 关键词、OG 标签 | 了解站点主题 |
| `elements.links` | 样式表路径 | 识别 CMS 框架（如 `vsb.css`） |
| `elements.forms` | 表单 action/method/隐藏字段 | **拦截/构造请求的数据源** |
| `elements.idMap` | 所有带 id 的元素 | 快速定位关键 DOM 节点 |
| `elements.bodyText` | 页面全文 | 情报收集（联系方式、组织结构） |
| `elements.documentHTML` | 完整 HTML | **最全面的静态分析源** |
| `sources.inlineScripts` | 页面内联 JS 代码 | **搜索请求构造方式、API 参数暴露** |
| `sources.externalScripts` | 外链 JS 文件列表 | **定位核心 JS 文件，下载分析** |
| `sources.cssRules` | 样式规则 | CMS 特征识别 |
| `sources.resourceURLs` | 所有静态资源 URL | 批量资源下载 |
| `sources.sourceMaps` | Source Map 引用 | **反编译混淆/压缩的 JS 源码** |
| `sources.jsonld` | 结构化数据 | 了解页面内容结构 |
| `application.cookies` | Cookie 键值 | **会话劫持 / 身份信息获取** |
| `application.localStorage` | 本地存储 | Token 泄漏 / 用户偏好分析 |
| `application.sessionStorage` | 会话存储 | 临时状态获取 |
| `application.indexedDB` | 数据库列表 | 离线数据存储 |
| `application.cacheStorage` | SW 缓存列表 | PWA 离线数据 |
| `application.serviceWorkers` | SW 注册信息 | 拦截/分析 Service Worker |
| `application.globalStates` | 框架初始状态 | **获取 SSR 注入的 API 数据** |
| `application.manifestURL` | PWA Manifest | 获取应用元数据 |
