// 页面全量数据提取 — Elements / Sources / Application
(async function () {
  console.log('[extract] START');

  var result = {
    pageInfo: {},
    elements: {},
    sources: {},
    application: {},
    _debug: { steps: [], errors: [] }
  };

  function logStep(name) {
    console.log('[extract] ' + name);
    result._debug.steps.push(name + ' @ ' + Date.now());
    return name;
  }

  try {
    // =======================================================================
    // 0. 页面基本信息
    // =======================================================================
    logStep('0. pageInfo');
    result.pageInfo = {
      title: document.title,
      url: location.href,
      referrer: document.referrer,
      charset: document.characterSet,
      readyState: document.readyState,
      lastModified: document.lastModified,
      domain: location.hostname,
      protocol: location.protocol
    };

    // =======================================================================
    // 1. ELEMENTS
    // =======================================================================

    logStep('1.1 meta');
    var meta = {};
    var metaTags = document.querySelectorAll('meta');
    for (var mi = 0; mi < metaTags.length; mi++) {
      var m = metaTags[mi];
      var key = m.getAttribute('name')
        || m.getAttribute('property')
        || m.getAttribute('http-equiv')
        || m.getAttribute('charset')
        || '';
      var val = m.getAttribute('content') || m.getAttribute('charset') || '';
      if (key) {
        if (meta[key] !== undefined) {
          if (!Array.isArray(meta[key])) meta[key] = [meta[key]];
          meta[key].push(val);
        } else {
          meta[key] = val;
        }
      }
    }
    result.elements.meta = meta;

    logStep('1.2 links');
    var links = [];
    var linkEls = document.querySelectorAll('link');
    for (var li = 0; li < linkEls.length; li++) {
      var l = linkEls[li];
      links.push({
        rel: l.rel || '', href: l.href || '', type: l.type || '',
        title: l.title || '', sizes: l.getAttribute('sizes') || '',
        media: l.media || '', as: l.getAttribute('as') || '',
        crossorigin: l.getAttribute('crossorigin') || ''
      });
    }
    result.elements.links = links;

    logStep('1.3 tagCounts');
    var tagCounts = {};
    var allEls = document.querySelectorAll('*');
    for (var ti = 0; ti < allEls.length; ti++) {
      var tag = allEls[ti].tagName.toLowerCase();
      tagCounts[tag] = (tagCounts[tag] || 0) + 1;
    }
    result.elements.tagCounts = tagCounts;
    result.elements.totalElements = allEls.length;

    logStep('1.4 documentHTML');
    result.elements.documentHTML = document.documentElement.outerHTML;
    result.elements.bodyText = document.body ? document.body.innerText : '';

    logStep('1.5 forms');
    var forms = [];
    var formEls = document.querySelectorAll('form');
    for (var fi = 0; fi < formEls.length; fi++) {
      var f = formEls[fi];
      var formData = { action: f.action, method: (f.method || 'get').toUpperCase(), id: f.id || '', name: f.name || '', inputs: [] };
      var inputs = f.querySelectorAll('input, select, textarea, button');
      for (var ii = 0; ii < inputs.length; ii++) {
        var inp = inputs[ii];
        formData.inputs.push({
          tag: inp.tagName.toLowerCase(), type: inp.type || '',
          name: inp.name || inp.getAttribute('name') || '',
          value: inp.type === 'password' ? '***' : (inp.value || ''),
          placeholder: inp.placeholder || '', required: inp.required,
          disabled: inp.disabled, checked: inp.checked,
          readonly: inp.readOnly, id: inp.id || ''
        });
      }
      try { formData.valid = f.checkValidity(); } catch (e) { formData.valid = null; }
      forms.push(formData);
    }
    result.elements.forms = forms;

    logStep('1.6 idMap');
    var idMap = {};
    var idEls = document.querySelectorAll('[id]');
    for (var idi = 0; idi < idEls.length; idi++) {
      var el = idEls[idi];
      if (el.id && !idMap[el.id]) {
        idMap[el.id] = el.tagName.toLowerCase();
      }
    }
    result.elements.idMap = idMap;
    result.elements.idCount = idEls.length;

    logStep('1.7 images');
    var imgs = [];
    var imgEls = document.querySelectorAll('img');
    for (var imi = 0; imi < imgEls.length; imi++) {
      var img = imgEls[imi];
      imgs.push({
        src: img.src || img.getAttribute('data-src') || img.getAttribute('data-original') || '',
        alt: (img.alt || '').substring(0, 200),
        width: img.naturalWidth || img.width || 0,
        height: img.naturalHeight || img.height || 0
      });
    }
    result.elements.images = imgs;

    logStep('1.8 media');
    var media = [];
    var mediaEls = document.querySelectorAll('video, audio');
    for (var mei = 0; mei < mediaEls.length; mei++) {
      var md = mediaEls[mei];
      media.push({
        tag: md.tagName.toLowerCase(),
        src: md.src || md.currentSrc || '',
        duration: isNaN(md.duration) ? null : md.duration,
        paused: md.paused, muted: md.muted, readyState: md.readyState
      });
    }
    result.elements.media = media;

    logStep('1.9 canvases');
    var canvases = [];
    var canvasEls = document.querySelectorAll('canvas');
    for (var ci = 0; ci < canvasEls.length; ci++) {
      var c = canvasEls[ci];
      canvases.push({ width: c.width, height: c.height });
    }
    result.elements.canvases = canvases;

    logStep('1.10 frames');
    var frames = [];
    var iframeEls = document.querySelectorAll('iframe');
    for (var ifi = 0; ifi < iframeEls.length; ifi++) {
      var fr = iframeEls[ifi];
      frames.push({ src: fr.src || '', name: fr.name || '', id: fr.id || '', width: fr.width, height: fr.height });
    }
    result.elements.frames = frames;

    logStep('1.11 dataAttributes');
    var dataAttrs = {};
    for (var dai = 0; dai < allEls.length; dai++) {
      var del = allEls[dai];
      if (!del.attributes) continue;
      for (var ai = 0; ai < del.attributes.length; ai++) {
        var aname = del.attributes[ai].name;
        if (aname.indexOf('data-') === 0) {
          var short = aname.replace('data-', '');
          if (!dataAttrs[short]) dataAttrs[short] = [];
          if (dataAttrs[short].length < 50) dataAttrs[short].push(del.attributes[ai].value);
        }
      }
    }
    result.elements.dataAttributes = dataAttrs;

    // =======================================================================
    // 2. SOURCES
    // =======================================================================

    logStep('2.1 inlineScripts');
    var inlineScripts = [];
    var scriptEls = document.querySelectorAll('script');
    for (var si = 0; si < scriptEls.length; si++) {
      var scr = scriptEls[si];
      if (!scr.src && scr.textContent) {
        inlineScripts.push({ type: scr.type || 'text/javascript', length: scr.textContent.length, code: scr.textContent });
      }
    }
    result.sources.inlineScripts = inlineScripts;

    logStep('2.2 externalScripts');
    var externalScripts = [];
    for (var esi = 0; esi < scriptEls.length; esi++) {
      var escr = scriptEls[esi];
      if (escr.src) {
        externalScripts.push({
          src: escr.src, type: escr.type || 'text/javascript',
          async: escr.async, defer: escr.defer,
          integrity: escr.getAttribute('integrity') || '',
          crossorigin: escr.getAttribute('crossorigin') || ''
        });
      }
    }
    result.sources.externalScripts = externalScripts;

    logStep('2.3 jsonld');
    var jsonld = [];
    var jsonEls = document.querySelectorAll('script[type="application/ld+json"], script[type="application/json"]');
    for (var ji = 0; ji < jsonEls.length; ji++) {
      var jEl = jsonEls[ji];
      try {
        jsonld.push({ type: jEl.type, data: JSON.parse(jEl.textContent) });
      } catch (e) {
        jsonld.push({ type: jEl.type, raw: jEl.textContent.substring(0, 5000) });
      }
    }
    result.sources.jsonld = jsonld;

    logStep('2.4 inlineStyles');
    var inlineStyles = [];
    var styleEls = document.querySelectorAll('style');
    for (var sti = 0; sti < styleEls.length; sti++) {
      var st = styleEls[sti];
      inlineStyles.push({ length: st.textContent.length, text: st.textContent });
    }
    result.sources.inlineStyles = inlineStyles;

    logStep('2.5 externalStyles');
    var externalStyles = [];
    var styleLinks = document.querySelectorAll('link[rel="stylesheet"]');
    for (var sli = 0; sli < styleLinks.length; sli++) {
      externalStyles.push({
        href: styleLinks[sli].href || '', media: styleLinks[sli].media || '',
        title: styleLinks[sli].title || '', disabled: styleLinks[sli].disabled
      });
    }
    result.sources.externalStyles = externalStyles;

    logStep('2.6 cssRules');
    var cssRules = [];
    try {
      for (var ssi = 0; ssi < document.styleSheets.length; ssi++) {
        var ss = document.styleSheets[ssi];
        var entry = { href: ss.href || '(inline)', title: ss.title || '', disabled: ss.disabled, rules: [], ruleCount: 0 };
        try {
          if (ss.cssRules) {
            entry.ruleCount = ss.cssRules.length;
            for (var ri = 0; ri < ss.cssRules.length; ri++) {
              var rule = ss.cssRules[ri];
              if (rule.cssText) entry.rules.push(rule.cssText);
            }
          }
        } catch (e) {
          entry.error = 'cross-origin stylesheet, cannot read rules';
        }
        cssRules.push(entry);
      }
    } catch (e) {
      result._debug.errors.push('cssRules outer: ' + e.message);
    }
    result.sources.cssRules = cssRules;

    logStep('2.7 sourceMaps');
    var sourceMaps = [];
    for (var smi = 0; smi < inlineScripts.length; smi++) {
      var match = inlineScripts[smi].code.match(/\/\/#\s*sourceMappingURL\s*=\s*(\S+)/);
      if (match) sourceMaps.push({ source: 'inline script #' + (smi + 1), url: match[1] });
    }
    for (var emi = 0; emi < externalScripts.length; emi++) {
      if (externalScripts[emi].src.indexOf('.min.js') > -1) {
        sourceMaps.push({ source: externalScripts[emi].src, hint: 'minified, .map may exist at same path' });
      }
    }
    result.sources.sourceMaps = sourceMaps;

    logStep('2.8 resourceURLs');
    var resourceURLs = { images: [], fonts: [], media: [], favicons: [], other: [] };
    for (var rii = 0; rii < imgs.length; rii++) {
      if (imgs[rii].src && imgs[rii].src.indexOf('http') === 0) resourceURLs.images.push(imgs[rii].src);
    }
    for (var csi = 0; csi < cssRules.length; csi++) {
      var cr = cssRules[csi];
      if (cr.rules) {
        for (var cri = 0; cri < cr.rules.length; cri++) {
          var fmatch = cr.rules[cri].match(/url\(["']?([^"')]+\.(woff2?|ttf|otf|eot))["']?\)/i);
          if (fmatch) resourceURLs.fonts.push(fmatch[1]);
        }
      }
    }
    for (var mei2 = 0; mei2 < media.length; mei2++) {
      if (media[mei2].src && media[mei2].src.indexOf('http') === 0) resourceURLs.media.push(media[mei2].src);
    }
    for (var lki = 0; lki < links.length; lki++) {
      if (/icon/i.test(links[lki].rel) && links[lki].href) resourceURLs.favicons.push(links[lki].href);
    }
    result.sources.resourceURLs = resourceURLs;

    // =======================================================================
    // 3. APPLICATION
    // =======================================================================

    logStep('3.1 localStorage');
    var lsData = {};
    try {
      for (var lsi = 0; lsi < localStorage.length; lsi++) {
        var lk = localStorage.key(lsi);
        var lv = localStorage.getItem(lk);
        lsData[lk] = lv && lv.length > 10000 ? lv.substring(0, 10000) + '...(truncated)' : lv;
      }
    } catch (e) { lsData.__error = e.message; result._debug.errors.push('localStorage: ' + e.message); }
    result.application.localStorage = lsData;

    logStep('3.2 sessionStorage');
    var ssData = {};
    try {
      for (var ssi2 = 0; ssi2 < sessionStorage.length; ssi2++) {
        var ssk = sessionStorage.key(ssi2);
        var ssv = sessionStorage.getItem(ssk);
        ssData[ssk] = ssv && ssv.length > 10000 ? ssv.substring(0, 10000) + '...(truncated)' : ssv;
      }
    } catch (e) { ssData.__error = e.message; result._debug.errors.push('sessionStorage: ' + e.message); }
    result.application.sessionStorage = ssData;

    logStep('3.3 cookies');
    result.application.cookies = document.cookie;

    logStep('3.4 indexedDB');
    var idbData = [];
    try {
      if (typeof indexedDB.databases === 'function') {
        var dbs = await indexedDB.databases();
        logStep('3.4 indexedDB: got ' + dbs.length + ' databases');
        for (var dbi = 0; dbi < dbs.length; dbi++) {
          var dbInfo = { name: dbs[dbi].name, version: dbs[dbi].version, stores: {} };
          try {
            var db = await new Promise(function (resolve, reject) {
              var req = indexedDB.open(dbs[dbi].name);
              req.onsuccess = function () { resolve(req.result); };
              req.onerror = function () { reject(req.error); };
              req.onblocked = function () { reject(new Error('blocked')); };
            });
            dbInfo.stores = Array.from(db.objectStoreNames);
            try { db.close(); } catch (e) {}
          } catch (e) {
            dbInfo.stores = { __error: e.message };
            result._debug.errors.push('indexedDB open ' + dbs[dbi].name + ': ' + e.message);
          }
          idbData.push(dbInfo);
        }
      } else {
        idbData.push({ __note: 'indexedDB.databases() not supported' });
      }
    } catch (e) {
      idbData.push({ __error: e.message });
      result._debug.errors.push('indexedDB outer: ' + e.message);
    }
    result.application.indexedDB = idbData;

    logStep('3.5 cacheStorage');
    var cacheData = [];
    try {
      if (typeof caches !== 'undefined') {
        var cacheNames = await caches.keys();
        logStep('3.5 cacheStorage: got ' + cacheNames.length + ' caches');
        for (var cni = 0; cni < cacheNames.length; cni++) {
          var cacheName = cacheNames[cni];
          try {
            var cache = await caches.open(cacheName);
            var reqs = await cache.keys();
            var entries = [];
            for (var rqi = 0; rqi < Math.min(reqs.length, 500); rqi++) {
              entries.push(reqs[rqi].url);
            }
            cacheData.push({ name: cacheName, entryCount: reqs.length, entries: entries });
          } catch (e) {
            cacheData.push({ name: cacheName, __error: e.message });
            result._debug.errors.push('cacheStorage ' + cacheName + ': ' + e.message);
          }
        }
      }
    } catch (e) {
      cacheData.push({ __error: e.message });
      result._debug.errors.push('cacheStorage outer: ' + e.message);
    }
    result.application.cacheStorage = cacheData;

    logStep('3.6 serviceWorkers');
    var swData = [];
    try {
      if ('serviceWorker' in navigator) {
        var registrations = await navigator.serviceWorker.getRegistrations();
        logStep('3.6 serviceWorkers: got ' + registrations.length + ' registrations');
        for (var swi = 0; swi < registrations.length; swi++) {
          var reg = registrations[swi];
          swData.push({
            scope: reg.scope,
            updateViaCache: reg.updateViaCache,
            active: reg.active ? { scriptURL: reg.active.scriptURL, state: reg.active.state } : null,
            waiting: reg.waiting ? { scriptURL: reg.waiting.scriptURL, state: reg.waiting.state } : null,
            installing: reg.installing ? { scriptURL: reg.installing.scriptURL, state: reg.installing.state } : null
          });
        }
      }
    } catch (e) {
      swData.push({ __error: e.message });
      result._debug.errors.push('serviceWorkers: ' + e.message);
    }
    result.application.serviceWorkers = swData;

    logStep('3.7 manifest');
    var manifestLinkEl = document.querySelector('link[rel="manifest"]');
    result.application.manifestURL = manifestLinkEl ? manifestLinkEl.href : null;
    result.application.manifestData = null;
    if (manifestLinkEl && manifestLinkEl.href) {
      try {
        var resp = await fetch(manifestLinkEl.href);
        if (resp.ok) {
          result.application.manifestData = await resp.json();
        }
      } catch (e) {
        result.application.manifestData = { __error: e.message };
        result._debug.errors.push('manifest fetch: ' + e.message);
      }
    }

    logStep('3.8 windowKeys');
    try {
      result.application.windowKeys = 'skipped (too large)';
    } catch (e) {
      result.application.windowKeys = { __error: e.message };
    }

    logStep('3.9 globalStates');
    var globalStates = {};
    var stateKeys = ['__INITIAL_STATE__', '__NUXT__', '__NEXT_DATA__', '__APP_DATA__',
      '__PREFETCHED_STATE__', '__REDUX_STORE__', '__STORE__', '__APOLLO_STATE__',
      '__REACT_QUERY_STATE__', '__PINIA__', 'pageData', 'initialData', 'preloadedState',
      'store', 'app', 'dataLayer'];
    for (var gsi = 0; gsi < stateKeys.length; gsi++) {
      try {
        var val = window[stateKeys[gsi]];
        if (val !== undefined) {
          var type = typeof val;
          if (type === 'object') {
            globalStates[stateKeys[gsi]] = { type: type, preview: JSON.stringify(val).substring(0, 2000) };
          } else {
            globalStates[stateKeys[gsi]] = { type: type, value: String(val).substring(0, 1000) };
          }
        }
      } catch (e) {}
    }
    result.application.globalStates = globalStates;

    // =======================================================================
    // 4. 签名算法检测
    // =======================================================================
    logStep('4.0 signatureCheck');
    var sigResult = { needReverse: false, confidence: 'none', evidence: [], details: [] };

    // 4.0.1 外链 JS 文件名检测
    var cryptoFiles = [];
    var sigFilePatterns = /crypto|encrypt|decrypt|sign(?:ature)?|hmac|md5|sha(?:1|256|512)?|hash|fingerprint|fp\.min|device(?:id|token)?|turing|captcha|btoa|atob/i;
    externalScripts.forEach(function (s) {
      var fileName = (s.src || '').split('/').pop();
      if (sigFilePatterns.test(fileName)) {
        cryptoFiles.push({ file: fileName, url: s.src, match: fileName.match(sigFilePatterns)[0] });
      }
    });
    if (cryptoFiles.length > 0) {
      sigResult.evidence.push('检测到 ' + cryptoFiles.length + ' 个加密/签名相关 JS 文件');
      sigResult.details.push({ type: 'crypto_files', files: cryptoFiles });
    }

    // 4.0.2 内联脚本代码模式检测
    var sigCodePatterns = [];
    var sigPatterns = [
      { name: '请求签名', pattern: /(?:sign|signature|signvalue|_sign)\s*[=:]/i, weight: 'high' },
      { name: '哈希/加密调用', pattern: /(?:md5|sha(?:1|256|512)?|hmac|encrypt|decrypt)\s*\(/i, weight: 'high' },
      { name: 'Base64 编解码', pattern: /(?:btoa|atob|Base64\.encode|Buffer\.from.*base64)/i, weight: 'medium' },
      { name: 'CryptoJS 库', pattern: /CryptoJS\.(?:AES|MD5|SHA|Hmac|enc|dec)/i, weight: 'high' },
      { name: 'nonce/时间戳', pattern: /(?:nonce|timestamp|_t|ts)\s*[=:].*(?:sign|signature)/i, weight: 'medium' },
      { name: '密钥/Secret', pattern: /(?:appKey|appSecret|secretKey|apiSecret|accessKey)\s*[=:]\s*['"]/i, weight: 'high' },
      { name: 'X-Sign 请求头', pattern: /['"]X-Sign['"]|['"]x-sign['"]|['"]X-Timestamp['"]/i, weight: 'high' },
      { name: '设备指纹', pattern: /(?:fingerprint|deviceId|device_id|canvas.*fingerprint|webgl.*fingerprint)/i, weight: 'medium' },
      { name: 'URL 签名参数', pattern: /[?&](?:sign|signature|token|_sign|htk|hash)\s*=/i, weight: 'medium' }
    ];
    inlineScripts.forEach(function (s) {
      sigPatterns.forEach(function (sp) {
        if (sp.pattern.test(s.code)) {
          sigCodePatterns.push({ name: sp.name, weight: sp.weight, preview: s.code.substring(Math.max(0, s.code.search(sp.pattern) - 40), s.code.search(sp.pattern) + 80) });
        }
      });
    });
    // 也检查 documentHTML 中的 URL 参数签名
    var htmlForSig = result.elements.documentHTML || '';
    sigPatterns.forEach(function (sp) {
      if (sp.name === 'URL 签名参数' && sp.pattern.test(htmlForSig)) {
        var matches = htmlForSig.match(/[?&](sign|signature|token|_sign|htk|hash)=([^&"'\s]+)/gi) || [];
        if (matches.length > 0 && !sigCodePatterns.some(function (p) { return p.name === 'URL 签名参数'; })) {
          sigCodePatterns.push({ name: 'URL 签名参数', weight: 'medium', preview: matches.slice(0, 5).join(', ') });
        }
      }
    });
    if (sigCodePatterns.length > 0) {
      sigResult.evidence.push('内联代码中发现 ' + sigCodePatterns.length + ' 处签名/加密模式');
      sigResult.details.push({ type: 'code_patterns', patterns: sigCodePatterns });
    }

    // 4.0.3 Cookie 中的特征值检测
    var sigCookies = [];
    if (result.application.cookies) {
      var cookiePairs2 = result.application.cookies.split(';');
      cookiePairs2.forEach(function (c) {
        var parts = c.trim().split('=');
        if (parts.length >= 2) {
          var cName = parts[0].trim();
          var cVal = parts.slice(1).join('=');
          // 检测看起来像 hash 的值（hex 32/64位 或 base64）
          if (/^[0-9a-fA-F]{32,64}$/.test(cVal)) {
            sigCookies.push({ name: cName, reason: '疑似 MD5/SHA 哈希值 (' + cVal.length + '字符)' });
          } else if (/^[A-Za-z0-9+/]{40,}={0,2}$/.test(decodeURIComponent(cVal))) {
            sigCookies.push({ name: cName, reason: '疑似 Base64 编码值' });
          }
          // 设备指纹相关 cookie
          if (/(?:smid|device|fingerprint|fp|visitor)/i.test(cName)) {
            sigCookies.push({ name: cName, reason: '设备指纹/访客标识' });
          }
        }
      });
    }
    if (sigCookies.length > 0) {
      sigResult.evidence.push('Cookie 中发现 ' + sigCookies.length + ' 个疑似加密/指纹值');
      sigResult.details.push({ type: 'sig_cookies', cookies: sigCookies });
    }

    // 4.0.4 综合判定
    var highEvidence = sigCodePatterns.filter(function (p) { return p.weight === 'high'; }).length;
    var totalEvidence = cryptoFiles.length + sigCodePatterns.length + sigCookies.length;
    if (cryptoFiles.length > 0 && highEvidence > 0) {
      sigResult.needReverse = true;
      sigResult.confidence = '确定';
    } else if (cryptoFiles.length > 0 || highEvidence >= 2 || (sigCodePatterns.length >= 2 && sigCookies.length > 0)) {
      sigResult.needReverse = true;
      sigResult.confidence = '很可能';
    } else if (totalEvidence >= 1) {
      sigResult.needReverse = false;
      sigResult.confidence = '可能不需要';
    } else {
      sigResult.needReverse = false;
      sigResult.confidence = '不需要';
    }

    result._signatureCheck = sigResult;

    // =======================================================================
    // 5. 重点数据自动识别
    // =======================================================================
    logStep('5. keyFindings');
    var findings = [];

    // 4.1 Cookies — 识别认证相关
    if (result.application.cookies) {
      var cookiePairs = result.application.cookies.split(';');
      var authCookies = [];
      var authNames = /token|session|auth|login|jwt|bearer|access|refresh|sid|uid|user|pass|PHPSESSID|JSESSIONID/i;
      cookiePairs.forEach(function (c) {
        var parts = c.trim().split('=');
        if (parts.length >= 2) {
          var cName = parts[0].trim();
          if (authNames.test(cName)) {
            authCookies.push({ name: cName, value: parts.slice(1).join('=') });
          }
        }
      });
      if (authCookies.length > 0) {
        findings.push({ category: '认证凭证', severity: 'high', detail: '发现 ' + authCookies.length + ' 个认证相关 Cookie', data: authCookies });
      }
      if (result.application.cookies.length > 0 && authCookies.length === 0) {
        var cookieEntries = [];
        cookiePairs.forEach(function (c) {
          var p = c.trim().split('=');
          if (p.length >= 2 && p[0].trim()) cookieEntries.push({ name: p[0].trim(), value: p.slice(1).join('=') });
        });
        if (cookieEntries.length > 0) {
          findings.push({ category: 'Cookie', severity: 'medium', detail: '发现 ' + cookieEntries.length + ' 个 Cookie（非 HttpOnly）', data: cookieEntries });
        }
      }
    }

    // 4.2 localStorage/sessionStorage — 识别 token/配置
    var storageFindings = [];
    var storageKeys = Object.keys(result.application.localStorage || {});
    storageKeys.forEach(function (k) {
      if (k === '__error') return;
      if (/token|auth|session|jwt|apiKey|secret|credential|config|setting|user/i.test(k) || result.application.localStorage[k].length < 500) {
        storageFindings.push({ type: 'localStorage', key: k, value: result.application.localStorage[k] });
      }
    });
    var ssKeys = Object.keys(result.application.sessionStorage || {});
    ssKeys.forEach(function (k) {
      if (k === '__error') return;
      if (/token|auth|session|jwt|apiKey|secret/i.test(k)) {
        storageFindings.push({ type: 'sessionStorage', key: k, value: result.application.sessionStorage[k] });
      }
    });
    if (storageFindings.length > 0) {
      findings.push({ category: '存储数据', severity: 'high', detail: '发现 ' + storageFindings.length + ' 个可疑存储项', data: storageFindings });
    }

    // 4.3 表单 — 识别搜索/登录/API 表单
    var interestingForms = [];
    (result.elements.forms || []).forEach(function (f) {
      var isInteresting = false;
      var reasons = [];
      if (/search|login|sign|auth|api|query/i.test(f.action || '')) { isInteresting = true; reasons.push('action 指向后端接口'); }
      if (f.inputs && f.inputs.length > 2) { isInteresting = true; reasons.push('字段数 > 2'); }
      var hasHidden = f.inputs && f.inputs.some(function (inp) { return inp.type === 'hidden'; });
      if (hasHidden && f.method === 'POST') { isInteresting = true; reasons.push('POST + 隐藏字段'); }
      if (isInteresting) interestingForms.push({ action: f.action, method: f.method, inputs: f.inputs, reasons: reasons });
    });
    if (interestingForms.length > 0) {
      findings.push({ category: '表单接口', severity: 'high', detail: '发现 ' + interestingForms.length + ' 个可疑表单', data: interestingForms });
    }

    // 4.4 内联脚本 — 识别 API 调用/编码/加密
    var interestingScripts = [];
    (result.sources.inlineScripts || []).forEach(function (s, i) {
      var tags = [];
      if (/fetch\s*\(|axios|XMLHttpRequest|\.ajax|\.get\s*\(|\.post\s*\(|\.getJSON/i.test(s.code)) tags.push('HTTP 请求');
      if (/btoa|atob|Base64|base64|encodeURI|decodeURI/i.test(s.code)) tags.push('编码/解码');
      if (/localStorage|sessionStorage|document\.cookie/i.test(s.code)) tags.push('存储操作');
      if (/token|auth|apiKey|secret|password|credential/i.test(s.code)) tags.push('凭证相关');
      if (/JSON\.parse|JSON\.stringify/i.test(s.code)) tags.push('JSON 处理');
      if (/\/\/#\s*sourceMappingURL/.test(s.code)) tags.push('Source Map 引用');
      if (tags.length > 0) {
        interestingScripts.push({ index: i + 1, length: s.length, tags: tags, preview: s.code.substring(0, 300) });
      }
    });
    if (interestingScripts.length > 0) {
      findings.push({ category: '可疑脚本', severity: 'high', detail: '发现 ' + interestingScripts.length + ' 个包含敏感逻辑的内联脚本', data: interestingScripts });
    }

    // 4.5 全局状态 — 框架初始数据
    var gsKeys = Object.keys(globalStates);
    if (gsKeys.length > 0) {
      findings.push({ category: '全局状态', severity: 'high', detail: '发现 ' + gsKeys.length + ' 个框架注入的初始数据：' + gsKeys.join(', '), data: globalStates });
    }

    // 4.6 Source Map
    if (sourceMaps.length > 0) {
      findings.push({ category: 'Source Map', severity: 'medium', detail: '发现 ' + sourceMaps.length + ' 个 Source Map 引用，可还原源码', data: sourceMaps });
    }

    // 4.7 JSON-LD
    if (jsonld.length > 0) {
      findings.push({ category: '结构化数据', severity: 'medium', detail: '发现 ' + jsonld.length + ' 个 JSON-LD 结构化数据', data: jsonld });
    }

    // 4.8 CMS 识别
    var cmsHints = [];
    var html = result.elements.documentHTML || '';
    if (/_sitegray|vsbscreen|dynclicks|\.vsb\.|Visual SiteBuilder/i.test(html)) cmsHints.push('Visual SiteBuilder (北京通元)');
    if (/wp-content|wp-includes|wordpress/i.test(html)) cmsHints.push('WordPress');
    if (/Drupal|drupal/i.test(html)) cmsHints.push('Drupal');
    if (/Joomla|joomla/i.test(html)) cmsHints.push('Joomla');
    if (/vue|react|angular|next|nuxt/i.test(html.toLowerCase()) && cmsHints.length === 0) {
      // 检查前端框架
      var frameworks = [];
      if (/vue|v-bind|v-if|v-for|v-model|__vue__/i.test(html)) frameworks.push('Vue.js');
      if (/react|react-dom|data-reactroot|data-reactid/i.test(html)) frameworks.push('React');
      if (/ng-version|_nghost/i.test(html)) frameworks.push('Angular');
      if (/__NEXT_DATA__|__NUXT__|_next\//i.test(html)) frameworks.push('Next.js/Nuxt');
      if (frameworks.length > 0) cmsHints.push('前端框架: ' + frameworks.join(', '));
    }
    var jsLibs = [];
    if (/jquery/i.test(html)) jsLibs.push('jQuery');
    if (/swiper/i.test(html)) jsLibs.push('Swiper');
    if (/bootstrap/i.test(html)) jsLibs.push('Bootstrap');
    if (/lodash/i.test(html)) jsLibs.push('Lodash');
    if (/moment/i.test(html)) jsLibs.push('Moment.js');
    if (cmsHints.length > 0 || jsLibs.length > 0) {
      findings.push({ category: '技术栈识别', severity: 'medium', detail: (cmsHints.length > 0 ? 'CMS: ' + cmsHints.join(', ') + '。' : '') + (jsLibs.length > 0 ? 'JS库: ' + jsLibs.join(', ') : ''), data: { cms: cmsHints, libraries: jsLibs } });
    }

    // 4.9 URL 路径中的 API 模式
    var allURLs = html.match(/["']([^"']*(?:api|v\d+|graphql|rest|ws|auth|login|oauth)["'][^"']*)/gi) || [];
    var apiPatterns = [];
    allURLs.forEach(function (u) {
      var clean = u.replace(/["']/g, '').substring(0, 200);
      if (apiPatterns.indexOf(clean) === -1) apiPatterns.push(clean);
    });
    if (apiPatterns.length > 0) {
      findings.push({ category: 'API 端点线索', severity: 'high', detail: '在 HTML 中发现 ' + apiPatterns.length + ' 个疑似 API URL', data: apiPatterns.slice(0, 30) });
    }

    result._keyFindings = { total: findings.length, items: findings };

    logStep('DONE');
    return result;

  } catch (err) {
    console.error('[extract] FATAL ERROR:', err.message, err.stack);
    result._debug.fatal = { message: err.message, stack: err.stack, step: result._debug.steps[result._debug.steps.length - 1] };
    return result;
  }
})();
