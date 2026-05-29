// 主世界 Hook — 通过 executeScript(world:'MAIN') 注入
// 劫持 fetch/XHR/WebSocket/console，数据存 document.__netCapture
(function () {
  if (window.__netHooked) return;
  window.__netHooked = true;

  var MAX = 500;
  var cap = { requests: [], wsFrames: [], consoleLogs: [], startTime: Date.now(), status: 'capturing' };
  document.__netCapture = cap;

  function pushReq(r) {
    cap.requests.push(r);
    if (cap.requests.length >= MAX) cap.requests.shift();
  }

  // --- fetch ---
  var _fetch = window.fetch;
  window.fetch = function (input, init) {
    var url = typeof input === 'string' ? input : (input.url || '');
    var method = (init && init.method) || 'GET';
    var reqHeaders = {};
    if (init && init.headers) {
      try {
        if (init.headers instanceof Headers) { init.headers.forEach(function (v, k) { reqHeaders[k] = v; }); }
        else if (Array.isArray(init.headers)) { init.headers.forEach(function (p) { reqHeaders[p[0]] = p[1]; }); }
        else { Object.keys(init.headers).forEach(function (k) { reqHeaders[k] = init.headers[k]; }); }
      } catch (_) {}
    }
    var reqBody = null;
    if (init && init.body) { try { reqBody = init.body.toString().substring(0, 5000); } catch (_) {} }
    var start = Date.now();
    var isMedia = /\.(jpg|jpeg|png|gif|webp|svg|ico|woff2?|ttf|eot|mp4|webm|mp3|wav|css|js)(\?|$)/i.test(url);
    var rec = { type: 'fetch', method: method, url: url, requestHeaders: reqHeaders, requestBody: reqBody, timestamp: start };
    return _fetch.call(this, input, init).then(function (resp) {
      rec.status = resp.status; rec.duration = Date.now() - start;
      rec.responseType = resp.headers.get('content-type') || '';
      rec.responseHeaders = {};
      resp.headers.forEach(function (v, k) { rec.responseHeaders[k] = v; });
      var isText = /json|xml|html|text|javascript|form/i.test(rec.responseType);
      if (isText && !isMedia) {
        return resp.clone().text().then(function (t) { rec.responseBody = t.substring(0, 10000); pushReq(rec); return resp; })
          .catch(function () { rec.responseBody = '(err)'; pushReq(rec); return resp; });
      }
      rec.responseBody = '(binary)'; pushReq(rec); return resp;
    }).catch(function (e) { rec.status = 0; rec.error = e.message; rec.duration = Date.now() - start; pushReq(rec); throw e; });
  };

  // --- XHR ---
  var OX = window.XMLHttpRequest;
  OX.prototype._open = OX.prototype.open;
  OX.prototype._send = OX.prototype.send;
  OX.prototype._setH = OX.prototype.setRequestHeader;
  OX.prototype.open = function (m, u) { this._nm = m; this._nu = u; this._nrh = {}; this._nst = Date.now(); return this._open.apply(this, arguments); };
  OX.prototype.setRequestHeader = function (n, v) { if (this._nrh) this._nrh[n] = v; return this._setH.apply(this, arguments); };
  OX.prototype.send = function (b) {
    var s = this; var rb = null;
    try { if (b) rb = b.toString().substring(0, 5000); } catch (_) {}
    var rec = { type: 'xhr', method: s._nm || 'GET', url: s._nu || '', requestHeaders: s._nrh || {}, requestBody: rb, timestamp: s._nst || Date.now() };
    s.addEventListener('readystatechange', function () {
      if (s.readyState === 4) {
        rec.status = s.status; rec.duration = Date.now() - rec.timestamp;
        var ct = s.getResponseHeader('content-type') || ''; rec.responseType = ct;
        rec.responseHeaders = {};
        var ah = s.getAllResponseHeaders();
        if (ah) ah.split('\r\n').forEach(function (l) { var p = l.split(': '); if (p.length >= 2) rec.responseHeaders[p[0]] = p.slice(1).join(': '); });
        rec.responseBody = /json|xml|html|text|javascript|form/i.test(ct) ? (s.responseText || '').substring(0, 10000) : '(binary)';
        pushReq(rec);
      }
    });
    return this._send.apply(this, arguments);
  };

  // --- WebSocket ---
  var OW = window.WebSocket;
  window.WebSocket = function (url, proto) {
    var ws = new OW(url, proto); var wsr = { url: url, timestamp: Date.now(), frames: [] };
    var _om;
    Object.defineProperty(ws, 'onmessage', {
      get: function () { return _om; },
      set: function (f) {
        _om = function (e) {
          try { wsr.frames.push({ d: 'in', data: (typeof e.data === 'string' ? e.data : '(bin)').substring(0, 3000), ts: Date.now() }); cap.wsFrames.push(wsr.frames[wsr.frames.length - 1]); } catch (_) {}
          if (f) f.call(this, e);
        };
      }
    });
    var _s = ws.send;
    ws.send = function (d) {
      try { wsr.frames.push({ d: 'out', data: (typeof d === 'string' ? d : '(bin)').substring(0, 3000), ts: Date.now() }); } catch (_) {}
      return _s.apply(this, arguments);
    };
    pushReq({ type: 'ws', url: url, timestamp: wsr.timestamp });
    return ws;
  };
  window.WebSocket.prototype = OW.prototype;

  // --- Console ---
  ['log', 'warn', 'error', 'info', 'debug'].forEach(function (lv) {
    var orig = console[lv];
    console[lv] = function () {
      cap.consoleLogs.push({ level: lv, args: Array.prototype.slice.call(arguments), timestamp: Date.now() });
      if (cap.consoleLogs.length > 300) cap.consoleLogs.shift();
      return orig.apply(console, arguments);
    };
  });

  console.log('[net-hook:MAIN] ACTIVE — ' + cap.requests.length + ' requests captured so far');

  // 自检：发一个测试 fetch 验证捕获链路
  setTimeout(function () {
    fetch(location.href, { method: 'HEAD' }).then(function () {
      console.log('[net-hook:MAIN] 自检通过 — 已捕获 ' + cap.requests.length + ' 条请求');
    }).catch(function () {});
  }, 100);
})();
