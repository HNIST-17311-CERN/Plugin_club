// --- DOM 引用 ---
var els = {
  // 公共
  pageTitle: document.getElementById('pageTitle'),
  statusText: document.getElementById('statusText'),
  // 配置
  dsKey: document.getElementById('dsKey'),
  saveKeyBtn: document.getElementById('saveKeyBtn'),
  configHint: document.getElementById('configHint'),
  // 标签
  tabBtns: document.querySelectorAll('.tab-btn'),
  // 图片
  extractBtn: document.getElementById('extractBtn'),
  loading: document.getElementById('loading'),
  loadingText: document.getElementById('loadingText'),
  error: document.getElementById('error'),
  imageSection: document.getElementById('imageSection'),
  selectAll: document.getElementById('selectAll'),
  selectCount: document.getElementById('selectCount'),
  downloadSelected: document.getElementById('downloadSelected'),
  imageGrid: document.getElementById('imageGrid'),
  downloadProgress: document.getElementById('downloadProgress'),
  progressText: document.getElementById('progressText'),
  progressFill: document.getElementById('progressFill'),
  imagePreview: document.getElementById('imagePreview'),
  previewImg: document.getElementById('previewImg'),
  previewUrl: document.getElementById('previewUrl'),
  closePreview: document.getElementById('closePreview'),
  copyUrlBtn: document.getElementById('copyUrlBtn'),
  // 网络
  netRefreshBtn: document.getElementById('netRefreshBtn'),
  netFetchBtn: document.getElementById('netFetchBtn'),
  netAiBtn: document.getElementById('netAiBtn'),
  netExportBtn: document.getElementById('netExportBtn'),
  netAi: document.getElementById('netAi'),
  netStatus: document.getElementById('netStatus'),
  netList: document.getElementById('netList'),
  netDetail: document.getElementById('netDetail'),
  netBackBtn: document.getElementById('netBackBtn'),
  netDetailContent: document.getElementById('netDetailContent'),
  // 数据
  extractDataBtn: document.getElementById('extractDataBtn'),
  dataLoading: document.getElementById('dataLoading'),
  dataLoadingText: document.getElementById('dataLoadingText'),
  dataError: document.getElementById('dataError'),
  dataSection: document.getElementById('dataSection'),
  dataSummary: document.getElementById('dataSummary'),
  keyOnly: document.getElementById('keyOnly'),
  sigResult: document.getElementById('sigResult'),
  keyFindings: document.getElementById('keyFindings'),
  exportDataBtn: document.getElementById('exportDataBtn'),
  dataTree: document.getElementById('dataTree')
};

var pageImages = [];
var selectedImages = {};
var currentTabId = null;
var pageTitle = '';
var pageData = null; // 存储提取的全量数据

// --- 标签切换 ---
els.tabBtns.forEach(function (btn) {
  btn.addEventListener('click', function () {
    var tab = this.getAttribute('data-tab');
    els.tabBtns.forEach(function (b) { b.classList.remove('active'); });
    this.classList.add('active');
    document.querySelectorAll('.tab-content').forEach(function (c) { c.classList.remove('active'); });
    document.getElementById('tab-' + tab).classList.add('active');
  });
});

// 配置面板 — API Key
chrome.storage.local.get('ds_api_key', function (r) {
  if (r.ds_api_key) { els.dsKey.value = r.ds_api_key; els.configHint.textContent = '已加载保存的 Key'; }
});
els.saveKeyBtn.addEventListener('click', function () {
  var v = els.dsKey.value.trim();
  if (!v) { els.configHint.textContent = 'Key 不能为空'; return; }
  chrome.storage.local.set({ ds_api_key: v }, function () {
    els.configHint.textContent = '已保存!';
    setTimeout(function () { els.configHint.textContent = ''; }, 1500);
  });
});

// --- 初始化 ---
async function init() {
  try {
    var tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    var tab = tabs[0];
    if (!tab) { setStatus('无法获取当前标签页'); return; }
    currentTabId = tab.id;

    if (tab.url && (tab.url.startsWith('chrome://') || tab.url.startsWith('edge://') || tab.url.startsWith('about:'))) {
      setStatus('无法在此类页面上使用');
      els.extractBtn.disabled = true;
      els.extractDataBtn.disabled = true;
      return;
    }

    pageTitle = tab.title || '(无标题)';
    els.pageTitle.textContent = pageTitle;
    setStatus('就绪');
  } catch (err) {
    setStatus('无法访问此页面，请刷新后重试');
    els.extractBtn.disabled = true;
    els.extractDataBtn.disabled = true;
  }
}

// =========================================================================
// 图片提取
// =========================================================================
els.extractBtn.addEventListener('click', async function () {
  if (!currentTabId) return;
  els.extractBtn.disabled = true;
  els.error.classList.add('hidden');
  els.imageSection.classList.add('hidden');
  els.loading.classList.remove('hidden');
  els.loadingText.textContent = '正在滚动加载图片...';
  setStatus('提取中...');

  try {
    var results = await chrome.scripting.executeScript({ target: { tabId: currentTabId }, files: ['images.js'] });
    els.loading.classList.add('hidden');
    pageImages = (results && results[0] && results[0].result) || [];
    selectedImages = {};
    els.selectAll.checked = false;
    updateSelectUI();

    if (pageImages.length === 0) {
      els.imageGrid.innerHTML = '<div class="image-grid-empty">此页面没有找到大图</div>';
    } else {
      renderImageGrid(pageImages);
    }
    els.downloadProgress.classList.add('hidden');
    els.imageSection.classList.remove('hidden');
    setStatus('找到 ' + pageImages.length + ' 张图片');
  } catch (err) {
    els.loading.classList.add('hidden');
    showError(els.error, '提取失败: ' + (err.message || '未知错误'));
    setStatus('失败');
  } finally {
    els.extractBtn.disabled = false;
  }
});

function renderImageGrid(images) {
  var html = '';
  images.forEach(function (img, i) {
    var sizeText = '';
    if (img.width && img.height) { sizeText = img.width + 'x' + img.height; }
    html += '<div class="image-card" data-index="' + i + '" data-src="' + escAttr(img.src) + '">' +
      '<div class="card-check"></div>' +
      '<img src="' + escAttr(img.src) + '" alt="' + escAttr(img.alt) + '" loading="lazy" onerror="this.style.display=\'none\'">' +
      '<div class="img-alt">' + escHtml(img.alt || '无描述') + '</div>' +
      (sizeText ? '<div class="img-size">' + sizeText + '</div>' : '') + '</div>';
  });
  els.imageGrid.innerHTML = html;
  els.imageGrid.querySelectorAll('.image-card').forEach(function (card) {
    card.addEventListener('click', function (e) {
      if (e.target.classList.contains('card-check')) { toggleSelect(parseInt(this.getAttribute('data-index'), 10)); return; }
      var idx = parseInt(this.getAttribute('data-index'), 10);
      var img = pageImages[idx];
      els.previewImg.src = img.src;
      els.previewUrl.textContent = img.src;
      els.imagePreview.classList.remove('hidden');
    });
  });
}

function toggleSelect(index) {
  if (selectedImages[index]) { delete selectedImages[index]; } else { selectedImages[index] = true; }
  var card = els.imageGrid.querySelector('[data-index="' + index + '"]');
  if (card) card.classList.toggle('selected', !!selectedImages[index]);
  var total = pageImages.length, count = Object.keys(selectedImages).length;
  els.selectAll.checked = (count === total && total > 0);
  els.selectAll.indeterminate = (count > 0 && count < total);
  updateSelectUI();
}

els.selectAll.addEventListener('change', function () {
  var checked = this.checked;
  pageImages.forEach(function (_, i) { if (checked) { selectedImages[i] = true; } else { delete selectedImages[i]; } });
  els.imageGrid.querySelectorAll('.image-card').forEach(function (card) { card.classList.toggle('selected', checked); });
  updateSelectUI();
});

function updateSelectUI() {
  var count = Object.keys(selectedImages).length;
  els.selectCount.textContent = '已选 ' + count + ' 张';
  els.downloadSelected.disabled = (count === 0);
  els.downloadSelected.textContent = count > 0 ? '下载选中 (' + count + ')' : '下载选中';
}

// --- 下载 ---
els.downloadSelected.addEventListener('click', function () {
  var indices = Object.keys(selectedImages).map(Number);
  if (indices.length === 0) return;
  var toDownload = indices.map(function (i) { return pageImages[i]; });
  startDownload(toDownload);
});

async function startDownload(images) {
  els.downloadProgress.classList.remove('hidden');
  els.downloadSelected.disabled = true;
  els.selectAll.disabled = true;

  var dlFolder = '图片提取';
  var dlTitle = sanitizeFilename(pageTitle).substring(0, 40) || '未命名';
  var total = images.length, done = 0, failed = 0;

  function updateDl() {
    var pct = Math.round((done + failed) / total * 100);
    els.progressFill.style.width = pct + '%';
    els.progressText.textContent = '下载中 ' + done + '/' + total;
  }

  for (var i = 0; i < images.length; i++) {
    var img = images[i], filename = getFilename(img.src, i);
    try {
      await new Promise(function (resolve) {
        chrome.downloads.download({
          url: img.src, filename: dlFolder + '/' + dlTitle + '/' + filename,
          saveAs: false, conflictAction: 'uniquify'
        }, function () {
          if (chrome.runtime.lastError) { failed++; } else { done++; }
          resolve();
        });
      });
      await new Promise(function (r) { setTimeout(r, 100); });
    } catch (_) { failed++; }
    updateDl();
  }

  setTimeout(function () {
    els.downloadProgress.classList.add('hidden');
    els.downloadSelected.disabled = false;
    els.selectAll.disabled = false;
    setStatus('完成：' + done + ' 成功' + (failed > 0 ? ', ' + failed + ' 失败' : ''));
  }, 600);
}

// --- 图片预览 ---
els.closePreview.addEventListener('click', function () { els.imagePreview.classList.add('hidden'); els.previewImg.src = ''; });
els.copyUrlBtn.addEventListener('click', function () {
  copyText(els.previewUrl.textContent, els.copyUrlBtn, '复制链接');
});

// =========================================================================
// 数据提取
// =========================================================================
els.extractDataBtn.addEventListener('click', async function () {
  if (!currentTabId) return;
  els.extractDataBtn.disabled = true;
  els.dataError.classList.add('hidden');
  els.dataSection.classList.add('hidden');
  els.dataLoading.classList.remove('hidden');
  els.dataLoadingText.textContent = '正在提取页面数据...';
  setStatus('提取数据中...');

  try {
    var results = await chrome.scripting.executeScript({ target: { tabId: currentTabId }, files: ['extract.js'] });
    els.dataLoading.classList.add('hidden');
    pageData = (results && results[0] && results[0].result) || {};

    if (!pageData || !pageData.pageInfo) {
      var debugInfo = '';
      if (pageData && pageData._debug) {
        var dbg = pageData._debug;
        debugInfo = '\n\n--- Debug ---\nSteps: ' + (dbg.steps || []).join(', ') +
          '\nErrors: ' + (dbg.errors || []).join('; ') +
          '\nFatal: ' + (dbg.fatal ? dbg.fatal.message + '\n' + dbg.fatal.stack : 'none') +
          '\nStep at crash: ' + (dbg.fatal ? dbg.fatal.step : 'N/A');
      } else {
        debugInfo = '\n\npageData keys: ' + JSON.stringify(pageData ? Object.keys(pageData) : 'null') +
          '\nraw result: ' + JSON.stringify(results);
      }
      showError(els.dataError, '数据提取失败，请刷新页面重试' + debugInfo);
      setStatus('失败');
    } else {
      renderSigCheck(pageData._signatureCheck);
      renderKeyFindings(pageData._keyFindings);
      renderDataTree(pageData);
      els.dataSection.classList.remove('hidden');
      if (pageData._keyFindings && pageData._keyFindings.total > 0) {
        els.keyOnly.parentElement.style.display = '';
      } else {
        els.keyOnly.parentElement.style.display = 'none';
      }
      var summary = [];
      if (pageData.elements) {
        summary.push('元素 ' + (pageData.elements.totalElements || 0) + ' 个');
        summary.push('图片 ' + (pageData.elements.images ? pageData.elements.images.length : 0) + ' 张');
        summary.push('表单 ' + (pageData.elements.forms ? pageData.elements.forms.length : 0) + ' 个');
      }
      if (pageData.sources) {
        summary.push('脚本 ' + ((pageData.sources.inlineScripts ? pageData.sources.inlineScripts.length : 0) + (pageData.sources.externalScripts ? pageData.sources.externalScripts.length : 0)) + ' 个');
        summary.push('样式 ' + ((pageData.sources.inlineStyles ? pageData.sources.inlineStyles.length : 0) + (pageData.sources.externalStyles ? pageData.sources.externalStyles.length : 0)) + ' 个');
      }
      if (pageData.application) {
        summary.push('LS ' + Object.keys(pageData.application.localStorage || {}).length + ' 项');
        summary.push('IDB ' + (pageData.application.indexedDB ? pageData.application.indexedDB.length : 0) + ' 库');
      }
      els.dataSummary.textContent = summary.join('  |  ');
      setStatus('数据提取完成');
    }
  } catch (err) {
    els.dataLoading.classList.add('hidden');
    showError(els.dataError, '提取失败: ' + (err.message || '未知错误'));
    setStatus('失败');
  } finally {
    els.extractDataBtn.disabled = false;
  }
});

// keyFindings category → tree anchor 映射
var KF_ANCHORS = {
  '认证凭证': 'kf-cookies',
  'Cookie': 'kf-cookies',
  '存储数据': 'kf-storage',
  '表单接口': 'kf-forms',
  '可疑脚本': 'kf-inline-scripts',
  '全局状态': 'kf-global-states',
  'Source Map': 'kf-sourcemaps',
  '结构化数据': 'kf-jsonld',
  'API 端点线索': 'kf-api-hints',
  '技术栈识别': 'kf-tech-stack'
};

function renderSigCheck(sc) {
  if (!sc) { els.sigResult.classList.add('hidden'); return; }
  els.sigResult.classList.remove('hidden');

  var cls, icon, verdict;
  if (sc.confidence === '确定') {
    cls = 'sig-need'; icon = '!'; verdict = '需要逆向签名算法';
  } else if (sc.confidence === '很可能') {
    cls = 'sig-likely'; icon = '?'; verdict = '很可能需要逆向签名';
  } else if (sc.confidence === '可能不需要') {
    cls = 'sig-maybe-not'; icon = '~'; verdict = '可能不需要逆向';
  } else {
    cls = 'sig-none'; icon = 'ok'; verdict = '未检测到签名算法';
  }

  var html = '<div class="sig-box ' + cls + '">';
  html += '<div class="sig-verdict"><span class="sig-icon">' + icon + '</span>' + escHtml(verdict) + '</div>';

  if (sc.evidence && sc.evidence.length > 0) {
    html += '<div class="sig-evidence">';
    sc.evidence.forEach(function (e) { html += '<div class="sig-evi-item">' + escHtml(e) + '</div>'; });
    html += '</div>';
  }

  // 展开详情
  if (sc.details && sc.details.length > 0) {
    html += '<div class="sig-details">';
    sc.details.forEach(function (d) {
      if (d.type === 'crypto_files') {
        html += '<div class="sig-detail-title">加密/签名 JS 文件：</div>';
        d.files.forEach(function (f) {
          html += '<div class="sig-detail-row"><code>' + escHtml(f.file) + '</code><span class="sig-tag">' + escHtml(f.match) + '</span></div>';
        });
      } else if (d.type === 'code_patterns') {
        html += '<div class="sig-detail-title">代码中的签名模式：</div>';
        d.patterns.forEach(function (p) {
          html += '<div class="sig-detail-row"><span class="sig-tag ' + (p.weight === 'high' ? 'sig-tag-high' : 'sig-tag-med') + '">' + escHtml(p.name) + '</span><code>' + escHtml(p.preview) + '</code></div>';
        });
      } else if (d.type === 'sig_cookies') {
        html += '<div class="sig-detail-title">可疑 Cookie：</div>';
        d.cookies.forEach(function (c) {
          html += '<div class="sig-detail-row"><span class="sig-tag">' + escHtml(c.name) + '</span>' + escHtml(c.reason) + '</div>';
        });
      }
    });
    html += '</div>';
  }

  html += '</div>';
  els.sigResult.innerHTML = html;
}

function renderKeyFindings(kf) {
  if (!kf || !kf.items || kf.items.length === 0) {
    els.keyFindings.classList.add('hidden');
    return;
  }
  els.keyFindings.classList.remove('hidden');
  var html = '<div class="kf-header">发现 ' + kf.total + ' 个重点数据项（点击跳转）</div>';
  kf.items.forEach(function (item) {
    var sevClass = item.severity === 'high' ? 'kf-high' : 'kf-medium';
    var anchor = KF_ANCHORS[item.category] || '';
    var clickable = anchor ? ' kf-clickable" onclick="scrollToFinding(\'' + anchor + '\')" title="点击跳转到对应位置' : '"';
    html += '<div class="kf-item ' + sevClass + clickable + '>';
    html += '<span class="kf-category">' + escHtml(item.category) + '</span>';
    html += '<span class="kf-severity">' + (item.severity === 'high' ? '高' : '中') + '</span>';
    html += '<span class="kf-detail">' + escHtml(item.detail) + '</span>';
    html += anchor ? '<span class="kf-arrow">&#10132;</span>' : '';
    html += '</div>';
  });
  els.keyFindings.innerHTML = html;
}

// 跳转到树中的对应位置
window.scrollToFinding = function (anchor) {
  var target = document.getElementById(anchor);
  if (!target) return;

  // 展开所有被折叠的祖先
  var parent = target.parentElement;
  while (parent) {
    if (parent.classList.contains('tree-section-body') && parent.classList.contains('collapsed')) {
      parent.classList.remove('collapsed');
      if (parent.previousElementSibling) parent.previousElementSibling.classList.remove('collapsed');
    }
    parent = parent.parentElement;
  }

  // 滚动到目标
  target.scrollIntoView({ behavior: 'smooth', block: 'center' });

  // 高亮闪烁
  target.classList.add('kf-flash');
  setTimeout(function () { target.classList.remove('kf-flash'); }, 1500);
};

// 重点模式切换
els.keyOnly.addEventListener('change', function () {
  var showKeyOnly = this.checked;
  els.dataTree.querySelectorAll('.tree-section, .tree-sub').forEach(function (el) {
    var hasHigh = el.querySelector('.kf-tag-high, .kf-tag-medium');
    if (showKeyOnly) {
      el.style.display = hasHigh ? '' : 'none';
    } else {
      el.style.display = '';
    }
  });
  if (showKeyOnly) {
    // 自动展开所有重点项
    els.dataTree.querySelectorAll('.tree-section-title.collapsed, .tree-sub-title.collapsed').forEach(function (el) {
      if (el.closest('.tree-section, .tree-sub') && el.closest('.tree-section, .tree-sub').querySelector('.kf-tag-high, .kf-tag-medium')) {
        toggleSection(el);
      }
    });
  }
});

function renderDataTree(data) {
  var html = '';

  // --- Page Info ---
  html += '<div class="tree-section">';
  html += '<div class="tree-section-title" onclick="toggleSection(this)">页面信息</div>';
  html += '<div class="tree-section-body">';
  html += renderKV(data.pageInfo);
  html += '</div></div>';

  // --- Elements ---
  if (data.elements) {
    html += '<div class="tree-section">';
    html += '<div class="tree-section-title" onclick="toggleSection(this)">Elements（元素）</div>';
    html += '<div class="tree-section-body">';

    if (data.elements.meta) {
      html += '<div class="tree-sub"><div class="tree-sub-title" onclick="toggleSection(this)">Meta 标签 (' + Object.keys(data.elements.meta).length + ')</div>';
      html += '<div class="tree-section-body">' + renderKV(data.elements.meta) + '</div></div>';
    }

    html += '<div class="tree-sub"><div class="tree-sub-title" onclick="toggleSection(this)">标签统计 (' + (data.elements.totalElements || 0) + ' 个元素)</div>';
    html += '<div class="tree-section-body">' + renderKV(data.elements.tagCounts) + '</div></div>';

    if (data.elements.idCount) {
      html += '<div class="tree-sub"><div class="tree-sub-title" onclick="toggleSection(this)">ID 映射 (' + data.elements.idCount + ' 个)</div>';
      html += '<div class="tree-section-body"><pre class="data-pre">' + escHtml(JSON.stringify(data.elements.idMap, null, 1)) + '</pre></div></div>';
    }

    if (data.elements.forms && data.elements.forms.length > 0) {
      html += '<div class="tree-sub" id="kf-forms"><div class="tree-sub-title" onclick="toggleSection(this)">表单 (' + data.elements.forms.length + ') <span class="kf-tag-high">重点</span></div>';
      html += '<div class="tree-section-body"><pre class="data-pre">' + escHtml(JSON.stringify(data.elements.forms, null, 1)) + '</pre></div></div>';
    }

    if (data.elements.links && data.elements.links.length > 0) {
      html += '<div class="tree-sub"><div class="tree-sub-title" onclick="toggleSection(this)">Link 标签 (' + data.elements.links.length + ')</div>';
      html += '<div class="tree-section-body"><pre class="data-pre">' + escHtml(JSON.stringify(data.elements.links, null, 1)) + '</pre></div></div>';
    }

    if (data.elements.images && data.elements.images.length > 0) {
      html += '<div class="tree-sub"><div class="tree-sub-title" onclick="toggleSection(this)">图片 (' + data.elements.images.length + ')</div>';
      html += '<div class="tree-section-body"><pre class="data-pre">' + escHtml(JSON.stringify(data.elements.images.slice(0, 200), null, 1)) + '</pre></div></div>';
    }

    if (data.elements.media && data.elements.media.length > 0) {
      html += '<div class="tree-sub"><div class="tree-sub-title" onclick="toggleSection(this)">媒体 (' + data.elements.media.length + ')</div>';
      html += '<div class="tree-section-body"><pre class="data-pre">' + escHtml(JSON.stringify(data.elements.media, null, 1)) + '</pre></div></div>';
    }

    if (data.elements.canvases && data.elements.canvases.length > 0) {
      html += '<div class="tree-sub"><div class="tree-sub-title" onclick="toggleSection(this)">Canvas (' + data.elements.canvases.length + ')</div>';
      html += '<div class="tree-section-body"><pre class="data-pre">' + escHtml(JSON.stringify(data.elements.canvases, null, 1)) + '</pre></div></div>';
    }

    if (data.elements.frames && data.elements.frames.length > 0) {
      html += '<div class="tree-sub"><div class="tree-sub-title" onclick="toggleSection(this)">iframe (' + data.elements.frames.length + ')</div>';
      html += '<div class="tree-section-body"><pre class="data-pre">' + escHtml(JSON.stringify(data.elements.frames, null, 1)) + '</pre></div></div>';
    }

    if (data.elements.dataAttributes && Object.keys(data.elements.dataAttributes).length > 0) {
      html += '<div class="tree-sub"><div class="tree-sub-title" onclick="toggleSection(this)">data-* 属性</div>';
      html += '<div class="tree-section-body"><pre class="data-pre">' + escHtml(JSON.stringify(data.elements.dataAttributes, null, 1)) + '</pre></div></div>';
    }

    if (data.elements.documentHTML) {
      html += '<div class="tree-sub"><div class="tree-sub-title" onclick="toggleSection(this)">完整 HTML (' + data.elements.documentHTML.length.toLocaleString() + ' 字符)</div>';
      html += '<div class="tree-section-body"><pre class="data-pre scroll-large">' + escHtml(data.elements.documentHTML) + '</pre></div></div>';
    }

    html += '</div></div>';
  }

  // --- Sources ---
  if (data.sources) {
    html += '<div class="tree-section">';
    html += '<div class="tree-section-title" onclick="toggleSection(this)">Sources（源代码）</div>';
    html += '<div class="tree-section-body">';

    if (data.sources.inlineScripts && data.sources.inlineScripts.length > 0) {
      html += '<div class="tree-sub" id="kf-inline-scripts"><div class="tree-sub-title" onclick="toggleSection(this)">内联脚本 (' + data.sources.inlineScripts.length + ') <span class="kf-tag-high">重点</span></div>';
      html += '<div class="tree-section-body">';
      data.sources.inlineScripts.forEach(function (s, i) {
        html += '<div class="tree-sub"><div class="tree-sub-title" onclick="toggleSection(this)"># ' + (i + 1) + ' (' + s.length.toLocaleString() + ' 字符 ' + (s.type || '') + ')</div>';
        html += '<div class="tree-section-body"><pre class="data-pre scroll-large">' + escHtml(s.code) + '</pre></div></div>';
      });
      html += '</div></div>';
    }

    if (data.sources.externalScripts && data.sources.externalScripts.length > 0) {
      html += '<div class="tree-sub"><div class="tree-sub-title" onclick="toggleSection(this)">外链脚本 (' + data.sources.externalScripts.length + ')</div>';
      html += '<div class="tree-section-body"><pre class="data-pre">' + escHtml(JSON.stringify(data.sources.externalScripts, null, 1)) + '</pre></div></div>';
    }

    if (data.sources.jsonld && data.sources.jsonld.length > 0) {
      html += '<div class="tree-sub" id="kf-jsonld"><div class="tree-sub-title" onclick="toggleSection(this)">JSON-LD / 结构化数据 (' + data.sources.jsonld.length + ') <span class="kf-tag-medium">重点</span></div>';
      html += '<div class="tree-section-body"><pre class="data-pre scroll-large">' + escHtml(JSON.stringify(data.sources.jsonld, null, 1)) + '</pre></div></div>';
    }

    if (data.sources.inlineStyles && data.sources.inlineStyles.length > 0) {
      html += '<div class="tree-sub"><div class="tree-sub-title" onclick="toggleSection(this)">内联样式 (' + data.sources.inlineStyles.length + ')</div>';
      html += '<div class="tree-section-body">';
      data.sources.inlineStyles.forEach(function (s, i) {
        html += '<div class="tree-sub"><div class="tree-sub-title" onclick="toggleSection(this)"># ' + (i + 1) + ' (' + s.length.toLocaleString() + ' 字符)</div>';
        html += '<div class="tree-section-body"><pre class="data-pre scroll-large">' + escHtml(s.text) + '</pre></div></div>';
      });
      html += '</div></div>';
    }

    if (data.sources.externalStyles && data.sources.externalStyles.length > 0) {
      html += '<div class="tree-sub"><div class="tree-sub-title" onclick="toggleSection(this)">外链样式 (' + data.sources.externalStyles.length + ')</div>';
      html += '<div class="tree-section-body"><pre class="data-pre">' + escHtml(JSON.stringify(data.sources.externalStyles, null, 1)) + '</pre></div></div>';
    }

    if (data.sources.cssRules && data.sources.cssRules.length > 0) {
      html += '<div class="tree-sub"><div class="tree-sub-title" onclick="toggleSection(this)">CSS 规则 (' + data.sources.cssRules.length + ' 个样式表)</div>';
      html += '<div class="tree-section-body"><pre class="data-pre">' + escHtml(JSON.stringify(data.sources.cssRules.map(function (r) { return { href: r.href, ruleCount: r.ruleCount, error: r.error }; }), null, 1)) + '</pre></div></div>';
    }

    if (data.sources.sourceMaps && data.sources.sourceMaps.length > 0) {
      html += '<div class="tree-sub" id="kf-sourcemaps"><div class="tree-sub-title" onclick="toggleSection(this)">Source Map (' + data.sources.sourceMaps.length + ') <span class="kf-tag-medium">重点</span></div>';
      html += '<div class="tree-section-body"><pre class="data-pre">' + escHtml(JSON.stringify(data.sources.sourceMaps, null, 1)) + '</pre></div></div>';
    }

    if (data.sources.resourceURLs) {
      html += '<div class="tree-sub"><div class="tree-sub-title" onclick="toggleSection(this)">资源 URL 汇总</div>';
      html += '<div class="tree-section-body"><pre class="data-pre">' + escHtml(JSON.stringify(data.sources.resourceURLs, null, 1)) + '</pre></div></div>';
    }

    html += '</div></div>';
  }

  // --- Application ---
  if (data.application) {
    html += '<div class="tree-section">';
    html += '<div class="tree-section-title" onclick="toggleSection(this)">Application（应用程序）</div>';
    html += '<div class="tree-section-body">';

    html += '<div class="tree-sub" id="kf-storage"><div class="tree-sub-title" onclick="toggleSection(this)">localStorage (' + Object.keys(data.application.localStorage || {}).length + ' 项) <span class="kf-tag-high">重点</span></div>';
    html += '<div class="tree-section-body">' + renderKV(data.application.localStorage) + '</div></div>';

    html += '<div class="tree-sub"><div class="tree-sub-title" onclick="toggleSection(this)">sessionStorage (' + Object.keys(data.application.sessionStorage || {}).length + ' 项)</div>';
    html += '<div class="tree-section-body">' + renderKV(data.application.sessionStorage) + '</div></div>';

    if (data.application.cookies) {
      html += '<div class="tree-sub" id="kf-cookies"><div class="tree-sub-title" onclick="toggleSection(this)">Cookies (非 HttpOnly) <span class="kf-tag-high">重点</span></div>';
      html += '<div class="tree-section-body"><pre class="data-pre">' + escHtml(data.application.cookies) + '</pre></div></div>';
    }

    if (data.application.indexedDB && data.application.indexedDB.length > 0) {
      html += '<div class="tree-sub"><div class="tree-sub-title" onclick="toggleSection(this)">IndexedDB (' + data.application.indexedDB.length + ' 个数据库)</div>';
      html += '<div class="tree-section-body"><pre class="data-pre">' + escHtml(JSON.stringify(data.application.indexedDB, null, 1)) + '</pre></div></div>';
    }

    if (data.application.cacheStorage && data.application.cacheStorage.length > 0) {
      html += '<div class="tree-sub"><div class="tree-sub-title" onclick="toggleSection(this)">Cache Storage (' + data.application.cacheStorage.length + ')</div>';
      html += '<div class="tree-section-body"><pre class="data-pre">' + escHtml(JSON.stringify(data.application.cacheStorage, null, 1)) + '</pre></div></div>';
    }

    if (data.application.serviceWorkers && data.application.serviceWorkers.length > 0) {
      html += '<div class="tree-sub"><div class="tree-sub-title" onclick="toggleSection(this)">Service Worker (' + data.application.serviceWorkers.length + ')</div>';
      html += '<div class="tree-section-body"><pre class="data-pre">' + escHtml(JSON.stringify(data.application.serviceWorkers, null, 1)) + '</pre></div></div>';
    }

    if (data.application.manifestURL || data.application.manifestData) {
      html += '<div class="tree-sub"><div class="tree-sub-title" onclick="toggleSection(this)">PWA Manifest</div>';
      html += '<div class="tree-section-body"><pre class="data-pre">' + escHtml(JSON.stringify({ url: data.application.manifestURL, data: data.application.manifestData }, null, 1)) + '</pre></div></div>';
    }

    if (data.application.globalStates && Object.keys(data.application.globalStates).length > 0) {
      html += '<div class="tree-sub" id="kf-global-states"><div class="tree-sub-title" onclick="toggleSection(this)">全局状态 (' + Object.keys(data.application.globalStates).length + ') <span class="kf-tag-high">重点</span></div>';
      html += '<div class="tree-section-body"><pre class="data-pre">' + escHtml(JSON.stringify(data.application.globalStates, null, 1)) + '</pre></div></div>';
    }

    if (data.application.windowKeys && Array.isArray(data.application.windowKeys) && data.application.windowKeys.length > 0) {
      html += '<div class="tree-sub"><div class="tree-sub-title" onclick="toggleSection(this)">window 自定义属性 (' + data.application.windowKeys.length + ')</div>';
      html += '<div class="tree-section-body"><pre class="data-pre">' + escHtml(data.application.windowKeys.join(', ')) + '</pre></div></div>';
    }

    html += '</div></div>';
  }

  els.dataTree.innerHTML = html;
}

// 简单的键值对渲染
function renderKV(obj) {
  if (!obj || Object.keys(obj).length === 0) return '<div class="data-empty">(无数据)</div>';
  var rows = '';
  Object.keys(obj).forEach(function (k) {
    var v = obj[k];
    if (typeof v === 'string') {
      if (v.length > 500) v = v.substring(0, 500) + '...';
    } else if (typeof v === 'object') {
      v = JSON.stringify(v, null, 1);
      if (v.length > 500) v = v.substring(0, 500) + '...';
    }
    rows += '<tr><td class="kv-key">' + escHtml(k) + '</td><td class="kv-val">' + escHtml(String(v)) + '</td></tr>';
  });
  return '<table class="kv-table">' + rows + '</table>';
}

// 折叠/展开
function toggleSection(el) {
  var body = el.nextElementSibling;
  if (body) {
    body.classList.toggle('collapsed');
    el.classList.toggle('collapsed');
  }
}

// --- 导出 ---
els.exportDataBtn.addEventListener('click', function () {
  if (!pageData) return;
  var json = JSON.stringify(pageData, null, 2);
  var blob = new Blob([json], { type: 'application/json' });
  var url = URL.createObjectURL(blob);
  chrome.downloads.download({
    url: url,
    filename: 'pageData_' + sanitizeFilename(pageTitle).substring(0, 40) + '.json',
    saveAs: true
  }, function () { setTimeout(function () { URL.revokeObjectURL(url); }, 2000); });
  setStatus('JSON 导出中...');
});

// =========================================================================
// 辅助
// =========================================================================
function showError(target, msg) { target.textContent = msg; target.classList.remove('hidden'); }
function setStatus(text) { els.statusText.textContent = text; }
function escHtml(s) { return (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
function escAttr(s) { return (s || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
function sanitizeFilename(name) { return (name || '').replace(/[<>:"/\\|?*\x00-\x1f]/g, '').replace(/\s+/g, ' ').trim(); }
function getFilename(url, index) {
  try { var pathname = new URL(url).pathname; var name = pathname.split('/').pop();
    if (name && name.length > 0 && name.length < 120 && /\.(jpg|jpeg|png|gif|webp|svg|bmp|ico|tiff)/i.test(name)) { return sanitizeFilename(name); }
  } catch (_) {}
  return 'image_' + (index + 1) + '.jpg';
}
function copyText(text, btn, originalLabel) {
  navigator.clipboard.writeText(text).then(function () {
    btn.textContent = '已复制!';
    setTimeout(function () { btn.textContent = originalLabel; }, 1500);
  }).catch(function () {
    var ta = document.createElement('textarea'); ta.value = text; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta);
    btn.textContent = '已复制!';
    setTimeout(function () { btn.textContent = originalLabel; }, 1500);
  });
}

// 挂到 window 供内联 onclick 调用
window.toggleSection = toggleSection;

// =========================================================================
// =========================================================================
// =========================================================================
// 网络捕获 — webRequest + background SW
// =========================================================================
var netCached = null;

async function readNetFromBg() {
  try {
    var resp = await chrome.runtime.sendMessage({ type: 'GET_NET' });
    if (resp && resp.ok) {
      netCached = resp;
      return resp;
    }
  } catch (e) {}
  return null;
}

// 刷新并抓取
els.netRefreshBtn.addEventListener('click', async function () {
  if (!currentTabId) return;
  els.netRefreshBtn.disabled = true;
  els.netRefreshBtn.textContent = '刷新中...';
  setStatus('清空+刷新...');
  try {
    await chrome.runtime.sendMessage({ type: 'CLEAR_NET' });
    netCached = null;
    await chrome.tabs.reload(currentTabId);
  } catch (e) {
    setStatus('失败: ' + e.message);
  }
  // popup closes here because page refreshes
  els.netRefreshBtn.disabled = false;
  els.netRefreshBtn.textContent = '刷新并抓取';
});

// 查看结果
els.netFetchBtn.addEventListener('click', async function () {
  els.netFetchBtn.disabled = true;
  els.netFetchBtn.textContent = '读取中...';
  setStatus('读取SW数据...');

  var data = netCached || await readNetFromBg();
  els.netFetchBtn.disabled = false;
  els.netFetchBtn.textContent = '查看结果';

  if (!data || !data.all || !data.all.length) {
    els.netStatus.classList.remove('hidden');
    els.netStatus.innerHTML = '暂无数据。<br><small>先点刷新并抓取，页面加载后再点查看结果。<br>如果SW不工作：edge://extensions/ 检查扩展是否启用、权限是否授权。</small>';
    els.netList.classList.add('hidden');
    setStatus('无数据');
    return;
  }

  var all = data.all;
  var xhr = all.filter(function (r) { return r.type === 'xmlhttprequest' || r.type === 'fetch'; });
  var doc = all.filter(function (r) { return r.type === 'main_frame' || r.type === 'sub_frame'; });
  var js = all.filter(function (r) { return r.type === 'script'; });

  els.netStatus.classList.add('hidden');
  var html = '<div class="net-info">总计 ' + all.length + ' | Fetch/XHR: ' + xhr.length + ' | JS: ' + js.length + ' | Doc: ' + doc.length + '</div>';

  if (xhr.length > 0) {
    html += '<div class="net-group-title">Fetch/XHR (' + xhr.length + ')</div><div class="net-req-list">';
    xhr.forEach(function (r, i) {
      var mc = r.method === 'GET' ? 'net-get' : (r.method === 'POST' ? 'net-post' : 'net-other');
      var sc = r.statusCode >= 400 ? 'net-err' : 'net-ok';
      var us = (r.url || '').replace(/^https?:\/\/[^\/]+/, '').substring(0, 55);
      html += '<div class="net-req-row" onclick="showXhrDetail(' + i + ')">';
      html += '<span class="net-method ' + mc + '">' + r.method + '</span>';
      html += '<span class="net-status ' + sc + '">' + (r.statusCode || '?') + '</span>';
      html += '<span class="net-url">' + escHtml(us) + '</span></div>';
    });
    html += '</div>';
  }

  html += '<div class="net-group-title">所有请求 (' + all.length + ')</div><div class="net-req-list">';
  all.slice(-100).forEach(function (r) {
    var us = (r.url || '').replace(/^https?:\/\/[^\/]+/, '').substring(0, 50);
    html += '<div class="net-req-row" style="font-size:10px">';
    html += '<span class="net-method net-other" style="font-size:9px">' + (r.type || '?') + '</span>';
    html += '<span class="net-status">' + (r.statusCode || '-') + '</span>';
    html += '<span class="net-url">' + escHtml(us) + '</span></div>';
  });
  html += '</div>';

  els.netList.innerHTML = html;
  els.netList.classList.remove('hidden');
  els.netExportBtn.classList.remove('hidden');
  setStatus(all.length + ' 请求');
});

// 导出 JSON
els.netExportBtn.addEventListener('click', function () {
  if (!netCached || !netCached.all) return;
  var json = JSON.stringify(netCached.all, null, 2);
  var blob = new Blob([json], { type: 'application/json' });
  var url = URL.createObjectURL(blob);
  chrome.downloads.download({
    url: url,
    filename: 'network_' + sanitizeFilename(pageTitle).substring(0, 30) + '_' + Date.now() + '.json',
    saveAs: true
  }, function () { setTimeout(function () { URL.revokeObjectURL(url); }, 2000); });
  setStatus('导出中...');
});

// API Key 持久化
chrome.storage.local.get('ds_api_key', function (r) {
  if (r.ds_api_key) els.dsKey.value = r.ds_api_key;
});
els.dsKey.addEventListener('input', function () {
  chrome.storage.local.set({ ds_api_key: this.value.trim() });
});

// AI 分析
els.netAiBtn.addEventListener('click', async function () {
  var key = els.dsKey.value.trim();
  if (!key) { setStatus('请先输入 DeepSeek API Key'); return; }
  if (!netCached || !netCached.all || !netCached.all.length) { setStatus('先查看结果再分析'); return; }

  els.netAiBtn.disabled = true;
  els.netAiBtn.textContent = '分析中...';
  setStatus('AI 分析中...');

  // 压缩请求数据：只保留关键字段
  var xhrReqs = netCached.all.filter(function (r) { return r.type === 'xmlhttprequest' || r.type === 'fetch'; });
  var allReqs = netCached.all;

  var summary = '共捕获 ' + netCached.all.length + ' 个请求，其中 API 请求 ' + xhrReqs.length + ' 个。\n\n';
  summary += '=== API 请求列表 ===\n';
  xhrReqs.forEach(function (r, i) {
    summary += (i + 1) + '. [' + r.method + '] ' + r.url + ' → ' + (r.statusCode || '?') + '\n';
  });
  if (allReqs.filter(function (r) { return r.type === 'script'; }).length > 0) {
    summary += '\n=== JS 文件 ===\n';
    allReqs.filter(function (r) { return r.type === 'script'; }).forEach(function (r, i) {
      summary += (i + 1) + '. ' + r.url + '\n';
    });
  }

  var prompt = '你是逆向工程专家。分析以下网页抓取的网络请求数据，输出：\n' +
    '1. API 接口清单（URL、方法、用途推断）\n' +
    '2. 认证方式（Token、Cookie、签名等）\n' +
    '3. 可疑的加密/签名参数\n' +
    '4. JS 文件中可能包含重要逻辑的文件\n' +
    '5. 逆向建议（优先分析哪些接口、可能的安全机制）\n\n' + summary;

  try {
    var resp = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + key },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: '你是逆向工程专家，擅长分析网络请求数据。用中文回答，简洁精准。' },
          { role: 'user', content: prompt }
        ],
        max_tokens: 3000
      })
    });
    var json = await resp.json();
    els.netAiBtn.disabled = false;
    els.netAiBtn.textContent = 'AI 分析';

    var text = '';
    if (json.choices && json.choices[0]) {
      text = json.choices[0].message.content;
    } else if (json.error) {
      text = 'API 错误: ' + json.error.message;
    } else {
      text = '未知响应: ' + JSON.stringify(json).substring(0, 500);
    }

    els.netAi.classList.remove('hidden');
    els.netAi.innerHTML = '<div class="ai-result"><div class="ai-title">AI 分析结果</div><div class="ai-body">' + escHtml(text).replace(/\n/g, '<br>') + '</div></div>';
    setStatus('AI 分析完成');
  } catch (e) {
    els.netAiBtn.disabled = false;
    els.netAiBtn.textContent = 'AI 分析';
    setStatus('请求失败: ' + e.message);
  }
});

// 请求详情
window.showXhrDetail = function (index) {
  var all = netCached ? netCached.all : [];
  var xhr = all.filter(function (x) { return x.type === 'xmlhttprequest' || x.type === 'fetch'; });
  var r = xhr[index];
  if (!r) return;
  els.netList.classList.add('hidden');
  els.netDetail.classList.remove('hidden');
  var h = '<div class="nd-section"><div class="nd-title">' + escHtml(r.method) + ' ' + escHtml(r.url) + '</div>';
  h += '<div class="nd-row"><span class="nd-key">Type</span><span>' + (r.type || '?') + '</span></div>';
  h += '<div class="nd-row"><span class="nd-key">Status</span><span>' + (r.statusCode || '?') + '</span></div></div>';
  if (r.responseHeaders && Object.keys(r.responseHeaders).length > 0) {
    h += '<div class="nd-section"><div class="nd-title">Response Headers</div>';
    Object.keys(r.responseHeaders).forEach(function (k) { h += '<div class="nd-row"><span class="nd-key">' + escHtml(k) + '</span><span class="nd-val">' + escHtml(String(r.responseHeaders[k]).substring(0, 200)) + '</span></div>'; });
    h += '</div>';
  }
  els.netDetailContent.innerHTML = h;
};

els.netBackBtn.addEventListener('click', function () {
  els.netDetail.classList.add('hidden');
  els.netList.classList.remove('hidden');
});

init();
