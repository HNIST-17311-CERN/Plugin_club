// 一次性的注入+捕获脚本 — 通过 executeScript(world:'MAIN') 执行
// 返回：当前已捕获的请求列表
(function () {
  // 如果已经装过了，直接返回当前数据
  if (window.__netHooked) {
    var cap = document.__netCapture;
    return cap ? { requests: cap.requests || [], startTime: cap.startTime, count: (cap.requests || []).length } : { requests: [], count: 0 };
  }
  window.__netHooked = true;

  var MAX = 500;
  var cap = { requests: [], startTime: Date.now() };
  document.__netCapture = cap;

  function push(r) {
    cap.requests.push(r);
    if (cap.requests.length >= MAX) cap.requests.shift();
  }

  // Hook fetch
  var _fetch = window.fetch;
  window.fetch = function (input, init) {
    var url = typeof input === 'string' ? input : (input.url || '');
    var method = (init && init.method) || 'GET';
    var rec = { type: 'fetch', method: method, url: url, timestamp: Date.now() };

    // 请求头
    var reqHeaders = {};
    if (init && init.headers) {
      try {
        if (init.headers instanceof Headers) { init.headers.forEach(function (v, k) { reqHeaders[k] = v; }); }
        else if (Array.isArray(init.headers)) { init.headers.forEach(function (p) { reqHeaders[p[0]] = p[1]; }); }
        else { Object.keys(init.headers).forEach(function (k) { reqHeaders[k] = init.headers[k]; }); }
      } catch (_) {}
    }
    rec.requestHeaders = reqHeaders;

    // 请求体
    if (init && init.body) {
      try { rec.requestBody = init.body.toString().substring(0, 8000); } catch (_) {}
    }

    return _fetch.call(this, input, init).then(function (resp) {
      rec.status = resp.status;
      rec.responseType = resp.headers.get('content-type') || '';
      rec.responseHeaders = {};
      resp.headers.forEach(function (v, k) { rec.responseHeaders[k] = v; });
      var isText = /json|xml|html|text|javascript/i.test(rec.responseType);
      if (isText) {
        return resp.clone().text().then(function (t) {
          rec.responseBody = t.substring(0, 15000);
          push(rec);
          return resp;
        }).catch(function () {
          rec.responseBody = '(err)';
          push(rec);
          return resp;
        });
      }
      rec.responseBody = '(binary)';
      push(rec);
      return resp;
    }).catch(function (e) {
      rec.status = 0;
      rec.error = e.message;
      push(rec);
      throw e;
    });
  };

  // Hook XHR
  var OX = window.XMLHttpRequest;
  var _open = OX.prototype.open;
  var _send = OX.prototype.send;
  var _setH = OX.prototype.setRequestHeader;
  OX.prototype.open = function (m, u) { this._nm = m; this._nu = u; this._nrh = {}; return _open.apply(this, arguments); };
  OX.prototype.setRequestHeader = function (n, v) { this._nrh[n] = v; return _setH.apply(this, arguments); };
  OX.prototype.send = function (b) {
    var s = this;
    var rec = { type: 'xhr', method: s._nm || 'GET', url: s._nu || '', requestHeaders: s._nrh || {}, timestamp: Date.now() };
    try { if (b) rec.requestBody = b.toString().substring(0, 8000); } catch (_) {}
    s.addEventListener('readystatechange', function () {
      if (s.readyState === 4) {
        rec.status = s.status;
        var ct = s.getResponseHeader('content-type') || '';
        rec.responseType = ct;
        rec.responseHeaders = {};
        var ah = s.getAllResponseHeaders();
        if (ah) ah.split('\r\n').forEach(function (l) { var p = l.split(': '); if (p.length >= 2) rec.responseHeaders[p[0]] = p.slice(1).join(': '); });
        rec.responseBody = /json|xml|html|text|javascript/i.test(ct) ? (s.responseText || '').substring(0, 15000) : '(binary)';
        push(rec);
      }
    });
    return _send.apply(this, arguments);
  };

  console.log('[net-capture] Hook installed (MAIN world), ' + cap.requests.length + ' requests so far');
  return { requests: [], count: 0, justInstalled: true };
})();
