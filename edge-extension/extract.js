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

    logStep('DONE');
    return result;

  } catch (err) {
    console.error('[extract] FATAL ERROR:', err.message, err.stack);
    result._debug.fatal = { message: err.message, stack: err.stack, step: result._debug.steps[result._debug.steps.length - 1] };
    return result;
  }
})();
