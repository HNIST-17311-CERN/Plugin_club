// 页面图片提取 + 自动滚动 — 支持虚拟滚动 / 普通滚动
(async function () {
  var allImages = [];
  var seen = {};

  function getSrc(img) {
    var s = img.getAttribute('data-src')
      || img.getAttribute('data-original')
      || img.getAttribute('data-lazy-src')
      || img.currentSrc
      || img.src
      || '';
    if (!s || s.indexOf('http') !== 0 || s.indexOf('data:') === 0) return '';

    if (img.srcset) {
      var parts = img.srcset.split(',');
      var best = '', bestW = 0;
      parts.forEach(function (p) {
        var m = p.trim().match(/^(\S+)\s+(\d+)w/);
        if (m) { var w = parseInt(m[2], 10); if (w > bestW) { bestW = w; best = m[1]; } }
      });
      if (best) s = best;
    }
    return s;
  }

  function isAd(img) {
    var el = img;
    for (var i = 0; i < 7; i++) {
      if (!el) break;
      var tag = (el.tagName || '').toLowerCase();
      var cls = (el.className || '').toString();
      var id = el.id || '';
      var role = el.getAttribute && el.getAttribute('role') || '';
      var combined = tag + '|' + cls + '|' + id + '|' + role;
      if (/ad[s\-]|advertisement|sponsor|banner-ad|ad-item|ad-media|ads-container|support-us|chapter-navigation__ad|bottom-tip/i.test(combined)) return true;
      el = el.parentElement;
    }
    return false;
  }

  function collect(isVirtual) {
    var imgs = document.querySelectorAll('img');
    imgs.forEach(function (img) {
      if (isAd(img)) return;
      var src = getSrc(img);
      if (!src || seen[src]) return;

      var w = img.naturalWidth || img.width || 0;
      var h = img.naturalHeight || img.height || 0;
      if (!isVirtual && w > 0 && h > 0 && (w < 50 || h < 50)) return;

      seen[src] = true;
      allImages.push({
        src: src,
        alt: (img.alt || '').substring(0, 100),
        width: w,
        height: h
      });
    });
  }

  var bodyStyle = getComputedStyle(document.body);
  var htmlStyle = getComputedStyle(document.documentElement);
  var windowLocked = bodyStyle.overflow === 'hidden' || bodyStyle.overflow === 'clip' ||
    document.body.style.overflow === 'hidden';

  var virtualScroller = document.querySelector(
    '[data-virtuoso-scroller="true"], [data-testid="virtuoso-scroller"]'
  );

  if (virtualScroller || windowLocked) {
    // 虚拟/容器滚动模式
    var scroller = virtualScroller;

    if (!scroller) {
      var allDivs = document.querySelectorAll('div, section, main, article');
      var bestH = 0;
      for (var c = 0; c < allDivs.length; c++) {
        try {
          var cs = getComputedStyle(allDivs[c]);
          var canScroll = (cs.overflowY === 'auto' || cs.overflowY === 'scroll' || cs.overflowY === 'visible');
          if (canScroll && allDivs[c].scrollHeight > allDivs[c].clientHeight + 200) {
            if (allDivs[c].scrollHeight > bestH) {
              bestH = allDivs[c].scrollHeight;
              scroller = allDivs[c];
            }
          }
        } catch (_) {}
      }
    }

    if (scroller) {
      var step = Math.round(scroller.clientHeight * 0.75) || 500;
      var pos = 0;
      var maxScroll = scroller.scrollHeight;
      var noNew = 0;

      scroller.scrollTop = 0;
      await new Promise(function (r) { setTimeout(r, 600); });
      collect(true);

      while (pos < maxScroll && noNew < 8) {
        var prevLen = allImages.length;
        pos += step;
        if (pos > maxScroll) pos = maxScroll;

        scroller.scrollTop = pos;
        scroller.dispatchEvent(new Event('scroll', { bubbles: true }));
        document.dispatchEvent(new Event('scroll', { bubbles: true }));

        await new Promise(function (r) { setTimeout(r, 600); });
        collect(true);

        if (allImages.length === prevLen) noNew++;
        else noNew = 0;

        maxScroll = Math.max(maxScroll, scroller.scrollHeight);
      }
    }
  } else {
    // 普通页面滚动模式
    var stepW = Math.round(window.innerHeight * 0.75);
    var posW = 0;
    var maxW = Math.max(
      document.documentElement.scrollHeight,
      document.body.scrollHeight
    );
    var noNewW = 0;

    window.scrollTo(0, 0);
    await new Promise(function (r) { setTimeout(r, 400); });
    collect(false);

    while (posW < maxW && noNewW < 8) {
      var prevLen = allImages.length;
      posW += stepW;
      window.scrollTo(0, posW);

      var containers = document.querySelectorAll(
        'main, article, [class*="reader"], [class*="viewer"], [class*="manga"], ' +
        '[class*="comic"], [class*="scroll"], [class*="content"], #reader, #viewer, #content'
      );
      for (var c = 0; c < containers.length; c++) {
        try {
          var el = containers[c];
          if (el.scrollHeight > el.clientHeight + 20) {
            el.scrollTop = Math.min(el.scrollTop + el.clientHeight * 0.75, el.scrollHeight);
          }
        } catch (_) {}
      }

      window.dispatchEvent(new Event('scroll', { bubbles: true }));

      await new Promise(function (r) { setTimeout(r, 800); });
      collect(false);

      if (allImages.length === prevLen) noNewW++;
      else noNewW = 0;

      maxW = Math.max(maxW,
        document.documentElement.scrollHeight,
        document.body.scrollHeight
      );
    }
  }

  await new Promise(function (r) { setTimeout(r, 800); });
  collect(true);

  return allImages.slice(0, 300);
})();
