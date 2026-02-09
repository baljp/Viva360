import fs from 'fs';
import path from 'path';

const roots = ['views', 'components'];
const exts = new Set(['.tsx', '.ts']);
const strictMode = process.argv.includes('--strict');

type Finding = {
  file: string;
  snippet: string;
};

const findings: Finding[] = [];

const walk = (dir: string) => {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === 'dist') continue;
      walk(full);
      continue;
    }
    if (!exts.has(path.extname(entry.name))) continue;
    scanFile(full);
  }
};

const scanFile = (file: string) => {
  const content = fs.readFileSync(file, 'utf8');
  const regex = /<button\b([\s\S]*?)>/g;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(content)) !== null) {
    const attrs = match[1] || '';
    const normalized = attrs.replace(/\s+/g, ' ').trim();
    const hasHandler = /\bonClick\s*=/.test(attrs);
    const isSubmit = /\btype\s*=\s*["']submit["']/.test(attrs);
    const isReset = /\btype\s*=\s*["']reset["']/.test(attrs);
    const hasHrefLike = /\bas\s*=\s*["']a["']/.test(attrs);
    const isDecorative = /\bdisabled\b/.test(attrs) && !hasHandler;

    if (!hasHandler && !isSubmit && !isReset && !hasHrefLike && !isDecorative) {
      findings.push({
        file,
        snippet: normalized.slice(0, 160),
      });
    }
  }
};

for (const root of roots) {
  if (fs.existsSync(root)) walk(root);
}

if (findings.length === 0) {
  console.log('button-audit: ok (no obvious dead buttons)');
  process.exit(0);
}

console.log(`button-audit: found ${findings.length} potential dead buttons`);
for (const finding of findings) {
  console.log(`- ${finding.file}: ${finding.snippet}`);
}

if (strictMode) {
  process.exit(1);
}

console.log('button-audit: warning mode (use --strict to fail)');
process.exit(0);
