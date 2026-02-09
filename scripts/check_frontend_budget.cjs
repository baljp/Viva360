const fs = require('fs');
const path = require('path');

const DIST_DIR = path.resolve(process.cwd(), 'dist', 'assets');

const BUDGETS = {
  maxMainJsBytes: 700 * 1024,
  maxTotalJsBytes: 2400 * 1024,
  maxTotalCssBytes: 500 * 1024,
};

const toKb = (bytes) => `${(bytes / 1024).toFixed(1)} KB`;

if (!fs.existsSync(DIST_DIR)) {
  console.error(`[perf:budget] Missing directory: ${DIST_DIR}`);
  process.exit(1);
}

const files = fs.readdirSync(DIST_DIR);
const jsFiles = files.filter((name) => name.endsWith('.js'));
const cssFiles = files.filter((name) => name.endsWith('.css'));

const sumBytes = (names) => names.reduce((acc, name) => {
  const fullPath = path.join(DIST_DIR, name);
  const stat = fs.statSync(fullPath);
  return acc + stat.size;
}, 0);

const totalJsBytes = sumBytes(jsFiles);
const totalCssBytes = sumBytes(cssFiles);

const mainChunkName = jsFiles.find((name) => /^index-.*\.js$/.test(name)) || jsFiles[0] || '';
const mainJsBytes = mainChunkName ? fs.statSync(path.join(DIST_DIR, mainChunkName)).size : 0;

const failures = [];

if (!mainChunkName) {
  failures.push('Could not resolve main JS chunk.');
}

if (mainJsBytes > BUDGETS.maxMainJsBytes) {
  failures.push(`Main chunk too large (${toKb(mainJsBytes)} > ${toKb(BUDGETS.maxMainJsBytes)})`);
}

if (totalJsBytes > BUDGETS.maxTotalJsBytes) {
  failures.push(`Total JS too large (${toKb(totalJsBytes)} > ${toKb(BUDGETS.maxTotalJsBytes)})`);
}

if (totalCssBytes > BUDGETS.maxTotalCssBytes) {
  failures.push(`Total CSS too large (${toKb(totalCssBytes)} > ${toKb(BUDGETS.maxTotalCssBytes)})`);
}

console.log('[perf:budget] Main chunk:', mainChunkName || 'n/a', mainChunkName ? `(${toKb(mainJsBytes)})` : '');
console.log('[perf:budget] Total JS:', toKb(totalJsBytes));
console.log('[perf:budget] Total CSS:', toKb(totalCssBytes));

if (failures.length > 0) {
  failures.forEach((failure) => console.error(`[perf:budget] ${failure}`));
  process.exit(1);
}

console.log('[perf:budget] OK');
