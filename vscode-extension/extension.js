const vscode = require('vscode');

const GRADES = [
  { name: 'SSS', min: 500, color: '#FFD700', glow: '#FFA500' },
  { name: 'SS',  min: 200, color: '#FF4444', glow: '#CC0000' },
  { name: 'S',   min: 100, color: '#FF8C00', glow: '#CC6600' },
  { name: 'A',   min: 60,  color: '#BB88FF', glow: '#7700CC' },
  { name: 'B',   min: 30,  color: '#4488FF', glow: '#0044CC' },
  { name: 'C',   min: 15,  color: '#44CC44', glow: '#007700' },
  { name: 'D',   min: 5,   color: '#AAAAAA', glow: '#666666' }
];

const TIMEOUT = 3000;
const TICK_MS = 100;

let combo = 0;
let maxCombo = 0;
let recordCombo = 0;
let timer = null;
let remainingMs = TIMEOUT;
let enabled = true;
let panel = null;
let ctx = null; // extension context

function getGrade(count) {
  for (const g of GRADES) if (count >= g.min) return g;
  return null;
}

function getHTML() {
  const grade = getGrade(combo);
  const pct = Math.max(0, Math.round(remainingMs / TIMEOUT * 100));
  const gradeName = grade ? grade.name : '';
  const gradeColor = grade ? grade.color : '#888';
  const glow = grade ? grade.glow : '#444';
  const barColor = remainingMs > 1000 ? '#4FC3F7' : '#FF7043';

  return `<!DOCTYPE html>
<html>
<head>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body {
      background: #1e1e2e;
      color: #cdd6f4;
      font-family: 'Segoe UI', sans-serif;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100vh;
      user-select: none;
      padding: 12px;
    }
    .combo-count {
      font-size: 64px;
      font-weight: 900;
      color: ${gradeColor};
      text-shadow: 0 0 20px ${glow};
      line-height: 1;
      transition: all 0.15s;
    }
    .combo-grade {
      font-size: 28px;
      font-weight: 800;
      color: ${gradeColor};
      letter-spacing: 3px;
      margin: 4px 0 8px;
      text-shadow: 0 0 12px ${glow};
      min-height: 36px;
    }
    .progress-container {
      width: 100%;
      height: 8px;
      background: #333;
      border-radius: 4px;
      overflow: hidden;
      margin-top: 8px;
    }
    .progress-bar {
      height: 100%;
      width: ${pct}%;
      background: ${barColor};
      border-radius: 4px;
      transition: width 0.1s linear;
    }
    .time-text {
      font-size: 11px;
      color: #888;
      margin-top: 4px;
    }
    .max-info {
      font-size: 10px;
      color: #666;
      margin-top: 8px;
    }
    @keyframes pulse {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.08); }
    }
    .pulsing { animation: pulse 0.3s ease; }
  </style>
</head>
<body>
  <div class="combo-count" id="count">${combo}</div>
  <div class="combo-grade">${gradeName}</div>
  <div class="progress-container">
    <div class="progress-bar"></div>
  </div>
  <div class="time-text">${(remainingMs / 1000).toFixed(1)}s</div>
  <div class="max-info">本次: ${maxCombo} | 记录: ${recordCombo} | ${enabled ? '●' : '○'}</div>
  <script>
    window.addEventListener('message', function(e) {
      var d = e.data;
      document.getElementById('count').textContent = d.combo;
      document.getElementById('count').className = 'combo-count ' + (d.justHit ? 'pulsing' : '');
      document.querySelector('.combo-grade').textContent = d.grade;
      document.querySelector('.combo-grade').style.color = d.gradeColor;
      document.querySelector('.combo-grade').style.textShadow = '0 0 12px ' + d.glow;
      document.getElementById('count').style.color = d.gradeColor;
      document.getElementById('count').style.textShadow = '0 0 20px ' + d.glow;
      document.querySelector('.progress-bar').style.width = d.pct + '%';
      document.querySelector('.progress-bar').style.background = d.remaining > 1000 ? '#4FC3F7' : '#FF7043';
      document.querySelector('.time-text').textContent = (d.remaining / 1000).toFixed(1) + 's';
      document.querySelector('.max-info').textContent = '本次: ' + d.maxCombo + ' | 记录: ' + d.record + ' | ' + (d.enabled ? '●' : '○');
    });
  </script>
</body>
</html>`;
}

function sendUpdate(justHit) {
  if (!panel) return;
  const grade = getGrade(combo);
  panel.webview.postMessage({
    combo, maxCombo, record: recordCombo,
    grade: grade ? grade.name : '',
    gradeColor: grade ? grade.color : '#888',
    glow: grade ? grade.glow : '#444',
    pct: Math.max(0, Math.round(remainingMs / TIMEOUT * 100)),
    remaining: remainingMs,
    enabled,
    justHit: !!justHit
  });
}

function resetCombo() {
  combo = 0;
  remainingMs = TIMEOUT;
  if (timer) { clearInterval(timer); timer = null; }
  sendUpdate(false);
}

function hit() {
  if (!enabled) return;
  combo++;
  if (combo > maxCombo) maxCombo = combo;
  if (combo > recordCombo) {
    recordCombo = combo;
    try { if (ctx) ctx.globalState.update('comboRecord', recordCombo); } catch (_) {}
  }
  refreshTimer();
}

function backspace() {
  if (!enabled) return;
  if (combo > 0) combo--;
  refreshTimer();
}

function refreshTimer() {
  remainingMs = TIMEOUT;
  if (timer) clearInterval(timer);
  timer = setInterval(() => {
    remainingMs -= TICK_MS;
    sendUpdate(false);
    if (remainingMs <= 0) resetCombo();
  }, TICK_MS);
  sendUpdate(true);
}

function activate(context) {
  ctx = context;
  recordCombo = context.globalState.get('comboRecord', 0);
  maxCombo = 0;
  combo = 0;

  panel = vscode.window.createWebviewPanel(
    'typingCombo',
    '打字连击',
    { viewColumn: vscode.ViewColumn.Beside, preserveFocus: true },
    { enableScripts: true, retainContextWhenHidden: true }
  );
  panel.webview.html = getHTML();

  panel.onDidDispose(() => {
    panel = null;
    resetCombo();
    vscode.window.showInformationMessage('打字连击面板已关闭，Ctrl+Shift+P → 打字连击: 打开面板 重新开启');
  });

  context.subscriptions.push(
    vscode.workspace.onDidChangeTextDocument((e) => {
      if (e.contentChanges.length === 0) return;
      var ch = e.contentChanges[0];
      var isDelete = ch.rangeLength > 0 && ch.text.length < ch.rangeLength;
      isDelete ? backspace() : hit();
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('typingCombo.toggle', () => {
      enabled = !enabled;
      if (!enabled) resetCombo();
      sendUpdate(false);
      vscode.window.showInformationMessage('连击: ' + (enabled ? 'ON' : 'OFF'));
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('typingCombo.reset', () => {
      const prev = maxCombo;
      resetCombo();
      maxCombo = 0;
      sendUpdate(false);
      vscode.window.showInformationMessage('已重置 | 本次最高: ' + prev + ' | 历史记录: ' + recordCombo);
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('typingCombo.open', () => {
      if (panel) { panel.reveal(); return; }
      activate(context);
    })
  );

  setInterval(() => sendUpdate(false), 1000);
}

function deactivate() {
  if (timer) clearInterval(timer);
}

module.exports = { activate, deactivate };
