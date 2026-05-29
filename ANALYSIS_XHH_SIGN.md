# 小黑盒签名算法 — 完整逆向

> 源码来源：`index-FrjtY7ot.js` (747KB, Vite 打包)
> 分析日期：2026-05-29

---

## 一、签名算法总览

小黑盒使用 **AES + RSA 混合加密 + MD5 签名**：

```
┌──────────────────────────────────────────────────────┐
│  请求参数 JSON                                        │
│    ↓                                                 │
│  [1] 生成随机 AES Key (16 ASCII chars)                │
│    ↓                                                 │
│  [2] AES-128-CBC 加密参数 (IV = "abcdefghijklmnop")  │
│    ↓                                                 │
│  [3] RSA-1024 公钥加密 AES Key                        │
│    ↓                                                 │
│  [4] MD5 生成签名 sid                                 │
│    ↓                                                 │
│  发送: { sid, key, data, time }                      │
└──────────────────────────────────────────────────────┘
```

---

## 二、RSA 公钥（硬编码在 JS 中）

### 公钥 #1：请求签名加密

```
-----BEGIN PUBLIC KEY-----
MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDZgjVwAiKTjZ55nG+mW6r3TSU4
ECvNYqDMIS/bhCj2QaH5GI/KZb2TBp+CBvUj9SLFnmJQ0kzHzHoGZCQ88VevCffF
7JePGF9cmKQqotlfTKbV4oxV5iLz7JSG6b/Vg7AXtrTolNtWsa8HiB0tI0YClYaQ
lOXm4UxLeSxQwSFETwIDAQAB
-----END PUBLIC KEY-----
```

| 属性 | 值 |
|------|-----|
| 算法 | RSA-1024 |
| 公钥指数 e | 65537 (0x010001) |
| 用途 | 加密随机 AES Key |

### 公钥 #2：设备指纹加密（portal101.cn 数美）

```
MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQCXj9exmI4nQjmT52iwr+yf7hAQ
06bfSZHTAHUfRBYiagCf/whhd8es0R79wBigpiHLd28TKA8b8mGR8OiiI1hV+qfy
nCWihvp3mdj8MiiH6SU3lhro2hkfYzImZB0RmWr2zE4Xt1+A6Oyp6bf+W7JSxYUX
Hw3nNv7Td4jw4jEFKQIDAQAB
```

| 属性 | 值 |
|------|-----|
| 组织 | `0yD85BjYvGFAvHaSQ1mc` |
| App ID | `heybox_website` |
| 服务商 | portal101.cn (数美科技) |
| 用途 | 加密设备指纹上报数据 |

---

## 三、核心函数源码还原

### 3.1 主签名函数 `J5(e, t)`

```javascript
function J5(e, t) {
  let n = Ib(),                  // 随机 16 字节 AES Key
      i = ~~(+new Date().getTime() / 1e3);  // Unix 秒级时间戳

  // AES-CBC 加密请求参数
  e = uE(JSON.stringify(e), n);

  // RSA-1024 加密 AES Key
  n = s_(n);

  // MD5 生成签名 sid
  let r = t
    ? Ct.MD5(e + i).toString() + Ct.MD5(n).toString()   // t=true:  data_hash + key_hash
    : Ct.MD5(n + i).toString() + Ct.MD5(e).toString();  // t=false: key_hash + data_hash

  return { sid: r, key: n, data: e };
}
```

### 3.2 变体签名函数 `e7(e, t)`

```javascript
function e7(e, t) {
  let n = Ib(),
      i = ~~(+new Date().getTime() / 1e3);

  // 先 gzip 压缩，再 AES 加密
  e = fE(Q5(new TextEncoder().encode(JSON.stringify(e))), n);

  n = s_(n);

  let r = t
    ? Ct.MD5(e + i).toString() + Ct.MD5(n).toString()
    : Ct.MD5(n + i).toString() + Ct.MD5(e).toString();

  return { sid: r, key: n, data: e, time: i };
}
```

### 3.3 随机 Key 生成 `Ib()`

```javascript
function Ib() {
  const chars = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ!\"#$%&'()*+,-./:;<=>?@[\\]^_`{|}~";
  let key = "";
  while (key.length < 16) {
    key += chars[Math.floor(chars.length * Math.random())];
  }
  return key;  // 16 chars from 96-char alphabet ≈ 104 bits entropy
}
```

### 3.4 RSA 加密 `s_(e)`

```javascript
function s_(e) {
  console.log("[browser]");
  let t = new QC();                    // QC = JSEncrypt 实例
  t.setPublicKey("-----BEGIN PUBLIC KEY-----\nMIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDZgjVwAiKTjZ55nG+mW6r3TSU4\nECvNYqDMIS/bhCj2QaH5GI/KZb2TBp+CBvUj9SLFnmJQ0kzHzHoGZCQ88VevCffF7JePGF9cmKQqotlfTKbV4oxV5iLz7JSG6b/Vg7AXtrTolNtWsa8HiB0tI0YClYaQlOXm4UxLeSxQwSFETwIDAQAB\n-----END PUBLIC KEY-----\n");
  return t.encrypt(e);                 // Base64 编码的 RSA 加密结果
}
```

### 3.5 AES-CBC 加密 `uE(data, key)`

```javascript
function uE(e, t) {
  let n = Ct.enc.Utf8.parse("abcdefghijklmnop");     // ⚠️ 固定 IV!
  return Ct.AES.encrypt(
    Ct.enc.Utf8.parse(e),
    Ct.enc.Utf8.parse(t),
    { iv: n, mode: Ct.mode.CBC }
  ).toString();
}
```

**注意**：IV 是固定值 `"abcdefghijklmnop"`，这是一个安全隐患。

### 3.6 压缩 + 加密 `fE` + `Q5`

```javascript
// Q5 = gzip 压缩
// fE = AES-CBC with random key
function fE(e, t) {
  const n = Ct.lib.WordArray.create(e);
  // ... AES encrypt
}
```

---

## 四、完整签名流程（Python 模拟代码）

```python
import json
import time
import random
import string
import hashlib
import base64
from Crypto.Cipher import AES, PKCS1_v1_5
from Crypto.PublicKey import RSA
from Crypto.Util.Padding import pad

PUBLIC_KEY_PEM = """-----BEGIN PUBLIC KEY-----
MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDZgjVwAiKTjZ55nG+mW6r3TSU4
ECvNYqDMIS/bhCj2QaH5GI/KZb2TBp+CBvUj9SLFnmJQ0kzHzHoGZCQ88VevCffF
7JePGF9cmKQqotlfTKbV4oxV5iLz7JSG6b/Vg7AXtrTolNtWsa8HiB0tI0YClYaQ
lOXm4UxLeSxQwSFETwIDAQAB
-----END PUBLIC KEY-----"""

AES_IV = b"abcdefghijklmnop"  # 固定 IV
CHARS = string.digits + string.ascii_lowercase + string.ascii_uppercase + "!\"#$%&'()*+,-./:;<=>?@[\\]^_`{|}~"

def ib():
    """生成随机 16 字节 AES Key"""
    return ''.join(random.choice(CHARS) for _ in range(16))

def ue(data: str, key: str) -> str:
    """AES-128-CBC 加密"""
    cipher = AES.new(key.encode(), AES.MODE_CBC, AES_IV)
    encrypted = cipher.encrypt(pad(data.encode(), 16))
    return base64.b64encode(encrypted).decode()

def s_(key: str) -> str:
    """RSA-1024 公钥加密 AES Key"""
    rsa_key = RSA.import_key(PUBLIC_KEY_PEM)
    cipher = PKCS1_v1_5.new(rsa_key)
    encrypted = cipher.encrypt(key.encode())
    return base64.b64encode(encrypted).decode()

def j5(payload: dict, t: bool = False) -> dict:
    """主签名函数"""
    aes_key = ib()
    timestamp = int(time.time())

    # AES 加密请求参数
    encrypted_data = ue(json.dumps(payload), aes_key)

    # RSA 加密 AES Key
    encrypted_key = s_(aes_key)

    # MD5 签名
    if t:
        sid = hashlib.md5((encrypted_data + str(timestamp)).encode()).hexdigest() + \
              hashlib.md5(encrypted_key.encode()).hexdigest()
    else:
        sid = hashlib.md5((encrypted_key + str(timestamp)).encode()).hexdigest() + \
              hashlib.md5(encrypted_data.encode()).hexdigest()

    return {
        "sid": sid,      # 64 hex chars = 2 × MD5
        "key": encrypted_key,  # RSA 加密的 AES Key (Base64)
        "data": encrypted_data # AES 加密的请求参数 (Base64)
    }

# 使用示例
result = j5({"link_id": "182261222", "limit": 20})
print(result)
```

---

## 五、加密参数对照表

| JS 变量 | 含义 | 值/格式 |
|---------|------|---------|
| `QC` | JSEncrypt 类 (RSA) | `jsencrypt@3.3.2` |
| `Ct` | CryptoJS 库 | AES + MD5 |
| `Ib()` | 随机 AES Key | 16 chars, 96 字符集 |
| `uE()` | AES-128-CBC | IV = `abcdefghijklmnop` |
| `s_()` | RSA-1024 加密 | 公钥 #1 |
| `J5()` | 签名函数 | 返回 `{sid, key, data}` |
| `e7()` | 签名函数 (gzip) | 返回 `{sid, key, data, time}` |
| `fE()` | AES 加密 | 配合 Q5 使用 |
| `Q5()` | gzip 压缩 | 请求体压缩 |

---

## 六、设备指纹配置（portal101.cn / 数美）

```javascript
window._smConf = {
  organization: "0yD85BjYvGFAvHaSQ1mc",  // 数美客户 ID
  appId: "heybox_website",                  // 应用标识
  publicKey: "MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQCXj9exmI4nQjmT52iwr+yf7hAQ06bfSZHTAHUfRBYiagCf/whhd8es0R79wBigpiHLd28TKA8b8mGR8OiiI1hV+qfynCWihvp3mdj8MiiH6SU3lhro2hkfYzImZB0RmWr2zE4Xt1+A6Oyp6bf+W7JSxYUXHw3nNv7Td4jw4jEFKQIDAQAB",
  staticHost: "static.portal101.cn",
  protocol: "https"
};
```

设备指纹由 `fp.min.js` 采集并通过 RSA 公钥 #2 加密后上报到 `static.portal101.cn`。

---

## 七、安全分析

| 方面 | 评价 |
|------|------|
| **AES IV 固定** | `"abcdefghijklmnop"` 硬编码，违反密码学最佳实践 |
| **RSA 1024-bit** | 1024 位已不够安全，推荐 2048+ |
| **MD5 签名** | MD5 已被证明存在碰撞，应用 SHA256 |
| **随机 Key 熵** | 96^16 ≈ 2^104，对暴力破解足够但对量子计算不足 |
| **混合加密** | AES+RSA 组合总体合理，但 IV 固定削弱了 AES-CBC 安全性 |
| **日志泄露** | `s_()` 函数打印 `[browser]` 到控制台（调试信息未清理） |

---

## 八、逆向过程记录

| 步骤 | 操作 | 结果 |
|------|------|------|
| 1 | 下载 `index-FrjtY7ot.js` (747KB) | 获取主业务逻辑 |
| 2 | 搜索 `setPublicKey` | 找到 RSA 公钥 #1 |
| 3 | 搜索 `function J5` | 找到主签名函数 |
| 4 | 搜索 `function Ib` | 找到随机 Key 生成器 |
| 5 | 搜索 `function uE` | 找到 AES 加密函数（含固定 IV） |
| 6 | 搜索 `smConf` / `publicKey` | 找到设备指纹配置 + 公钥 #2 |
| 7 | 还原算法 | 写出 Python 模拟代码 |
