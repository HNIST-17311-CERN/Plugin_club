// Service Worker - webRequest 浏览器级拦截
// 每次请求立即写入 storage，SW 休眠也不丢数据
var KEY = '__net_requests';

// 追加一条请求到 storage
function append(req) {
  chrome.storage.local.get(KEY, function (s) {
    var list = (s && s[KEY]) || [];
    if (list.length >= 800) list.shift();
    list.push(req);
    chrome.storage.local.set({ [KEY]: list });
  });
}

// 更新某条请求的响应信息
function updateResp(requestId, statusCode, responseHeaders) {
  chrome.storage.local.get(KEY, function (s) {
    var list = (s && s[KEY]) || [];
    for (var i = list.length - 1; i >= 0; i--) {
      if (list[i].id === requestId) {
        list[i].statusCode = statusCode;
        list[i].responseHeaders = {};
        if (responseHeaders) {
          for (var j = 0; j < responseHeaders.length; j++) {
            list[i].responseHeaders[responseHeaders[j].name] = responseHeaders[j].value;
          }
        }
        chrome.storage.local.set({ [KEY]: list });
        return;
      }
    }
  });
}

// === 拦截请求 ===
chrome.webRequest.onBeforeRequest.addListener(
  function (d) {
    append({
      id: d.requestId,
      url: d.url,
      method: d.method,
      type: d.type,
      timeStamp: d.timeStamp,
      tabId: d.tabId
    });
  },
  { urls: ['<all_urls>'] },
  []
);

// === 拦截响应头 ===
chrome.webRequest.onResponseStarted.addListener(
  function (d) {
    updateResp(d.requestId, d.statusCode, d.responseHeaders);
  },
  { urls: ['<all_urls>'] },
  ['responseHeaders', 'extraHeaders']
);

// === 响应 popup 消息 ===
chrome.runtime.onMessage.addListener(function (msg, sender, sendResponse) {
  if (msg.type === 'GET_NET') {
    chrome.storage.local.get(KEY, function (s) {
      var all = (s && s[KEY]) || [];
      sendResponse({ ok: true, all: all, count: all.length });
    });
    return true; // async
  }
  if (msg.type === 'CLEAR_NET') {
    chrome.storage.local.remove(KEY, function () {
      sendResponse({ ok: true });
    });
    return true;
  }
});

console.log('[bg] webRequest interceptor started');
