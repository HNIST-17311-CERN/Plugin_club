var els = {
  pageTitle: document.getElementById('pageTitle'),
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
  statusText: document.getElementById('statusText')
};

var pageImages = [];
var selectedImages = {};
var currentTabId = null;
var pageTitle = '';

async function init() {
  try {
    var tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    var tab = tabs[0];
    if (!tab) { setStatus('无法获取当前标签页'); return; }
    currentTabId = tab.id;

    if (tab.url && (tab.url.startsWith('chrome://') || tab.url.startsWith('edge://') || tab.url.startsWith('about:'))) {
      setStatus('无法在此类页面上使用');
      els.extractBtn.disabled = true;
      return;
    }

    pageTitle = tab.title || '(无标题)';
    els.pageTitle.textContent = pageTitle;
    setStatus('就绪');
  } catch (err) {
    setStatus('无法访问此页面，请刷新后重试');
    els.extractBtn.disabled = true;
  }
}

// --- 提取图片 ---
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
    showError('提取失败: ' + (err.message || '未知错误'));
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
          url: img.src,
          filename: dlFolder + '/' + dlTitle + '/' + filename,
          saveAs: false,
          conflictAction: 'uniquify'
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
  var url = els.previewUrl.textContent;
  navigator.clipboard.writeText(url).then(function () {
    els.copyUrlBtn.textContent = '已复制!';
    setTimeout(function () { els.copyUrlBtn.textContent = '复制链接'; }, 1500);
  }).catch(function () {
    var ta = document.createElement('textarea'); ta.value = url; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta);
    els.copyUrlBtn.textContent = '已复制!';
    setTimeout(function () { els.copyUrlBtn.textContent = '复制链接'; }, 1500);
  });
});

// --- 辅助 ---
function showError(msg) { els.error.textContent = msg; els.error.classList.remove('hidden'); }
function setStatus(text) { els.statusText.textContent = text; }
function escHtml(s) { return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
function escAttr(s) { return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
function sanitizeFilename(name) { return name.replace(/[<>:"/\\|?*\x00-\x1f]/g, '').replace(/\s+/g, ' ').trim(); }
function getFilename(url, index) {
  try {
    var pathname = new URL(url).pathname; var name = pathname.split('/').pop();
    if (name && name.length > 0 && name.length < 120 && /\.(jpg|jpeg|png|gif|webp|svg|bmp|ico|tiff)/i.test(name)) { return sanitizeFilename(name); }
  } catch (_) {}
  return 'image_' + (index + 1) + '.jpg';
}

init();
