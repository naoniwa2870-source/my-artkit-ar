/**
 * assets/ フォルダを監視して自動デプロイ
 * 素材を置くだけで Vercel に反映される
 */
const chokidar = require('chokidar');
const { execSync } = require('child_process');
const path = require('path');

const ASSETS_DIR = path.join(__dirname, 'assets');
const DEBOUNCE_MS = 5000;      // ファイルコピー完了を待つ時間（ms）
const WRITE_STABLE_MS = 4000;  // 書き込みが止まってから確定するまでの時間（ms）

console.log('');
console.log('═══════════════════════════════════════');
console.log('  AR アセット自動デプロイ 監視中...');
console.log('  assets/ フォルダに素材を置くだけで');
console.log('  自動で本番に反映されます。');
console.log('═══════════════════════════════════════');
console.log('');

let deployTimer = null;
let pendingFiles = new Set();

function scheduleDeployment(filepath) {
  pendingFiles.add(path.relative(__dirname, filepath));
  clearTimeout(deployTimer);
  deployTimer = setTimeout(runDeployment, DEBOUNCE_MS);
  process.stdout.write('\r  検知: ' + pendingFiles.size + ' ファイル変更... ' + DEBOUNCE_MS / 1000 + '秒後にデプロイ開始');
}

function runDeployment() {
  const files = Array.from(pendingFiles);
  pendingFiles.clear();

  console.log('\n');
  console.log('  ──────────────────────────────────');
  console.log('  デプロイ開始: ' + new Date().toLocaleTimeString('ja-JP'));
  files.forEach(f => console.log('    + ' + f));
  console.log('  ──────────────────────────────────');

  try {
    execSync('git add assets/', { cwd: __dirname, stdio: 'pipe' });

    const status = execSync('git status --porcelain', { cwd: __dirname }).toString().trim();
    if (!status) {
      console.log('  変更なし（スキップ）\n');
      return;
    }

    const msg = 'auto: add assets [' + new Date().toISOString().slice(0, 16).replace('T', ' ') + ']';
    execSync('git commit -m "' + msg + '"', { cwd: __dirname, stdio: 'pipe' });
    console.log('  コミット完了');

    execSync('git push origin main', { cwd: __dirname, stdio: 'pipe' });
    console.log('  プッシュ完了 → Vercel デプロイ開始');
    console.log('  約30秒後に本番反映されます。');
    console.log('');
  } catch (err) {
    console.error('  エラー:', err.message);
    console.error('  git の状態を確認してください。');
    console.log('');
  }
}

chokidar.watch(ASSETS_DIR, {
  ignored: /(^|[/\\])\../,
  persistent: true,
  ignoreInitial: true,
  awaitWriteFinish: {
    stabilityThreshold: WRITE_STABLE_MS,
    pollInterval: 500
  }
})
  .on('add', scheduleDeployment)
  .on('change', scheduleDeployment)
  .on('error', err => console.error('監視エラー:', err));
