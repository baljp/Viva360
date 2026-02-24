import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

type Match = { file: string; line: number; text: string };

const cwd = process.cwd();
const reportsDir = path.join(cwd, 'reports');
if (!fs.existsSync(reportsDir)) fs.mkdirSync(reportsDir, { recursive: true });

const raw = execSync(
  "rg -n --no-heading '(^|[^A-Za-z0-9_])setTimeout\\(' --glob '!node_modules/**' --glob '!dist/**' .",
  { cwd, stdio: ['ignore', 'pipe', 'pipe'], encoding: 'utf8' },
);

const matches: Match[] = raw
  .split('\n')
  .map((line) => line.trim())
  .filter(Boolean)
  .map((line) => {
    const [file, lineNo, ...rest] = line.split(':');
    return {
      file: file.replace(/^\.\//, ''),
      line: Number(lineNo || 0),
      text: rest.join(':').trim(),
    };
  });

const isNonProdPath = (f: string) =>
  f.startsWith('qa/') ||
  f.startsWith('scripts/') ||
  f.startsWith('reports/') ||
  f.startsWith('backend/scripts/') ||
  f.startsWith('tests/') ||
  f.includes('/tests/') ||
  f.endsWith('.test.ts') ||
  f.endsWith('.test.tsx') ||
  f.endsWith('.spec.ts') ||
  f.endsWith('.spec.tsx');

const runtime = matches.filter((m) => !isNonProdPath(m.file));
const frontendRuntime = runtime.filter((m) => /^(src|views|components|services)\//.test(m.file) || m.file === 'index.tsx');
const backendRuntime = runtime.filter((m) => m.file.startsWith('backend/src/'));

const byFile = runtime.reduce<Record<string, number>>((acc, m) => {
  acc[m.file] = (acc[m.file] || 0) + 1;
  return acc;
}, {});

const topFiles = Object.entries(byFile)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 25)
  .map(([file, count]) => ({ file, count }));

const payload = {
  generatedAt: new Date().toISOString(),
  totals: {
    allMatches: matches.length,
    runtime: runtime.length,
    frontendRuntime: frontendRuntime.length,
    backendRuntime: backendRuntime.length,
  },
  topFiles,
  samples: {
    runtime: runtime.slice(0, 100),
  },
};

fs.writeFileSync(path.join(reportsDir, 'settimeout_usage_audit.json'), JSON.stringify(payload, null, 2));
const md = [
  '# setTimeout Usage Audit',
  '',
  `Gerado em: ${payload.generatedAt}`,
  '',
  `Total (repo): ${payload.totals.allMatches}`,
  `Runtime: ${payload.totals.runtime}`,
  `Frontend runtime: ${payload.totals.frontendRuntime}`,
  `Backend runtime: ${payload.totals.backendRuntime}`,
  '',
  '## Top arquivos (runtime)',
  ...topFiles.map((x) => `- ${x.file}: ${x.count}`),
  '',
];
fs.writeFileSync(path.join(reportsDir, 'settimeout_usage_audit.md'), `${md.join('\n')}\n`);

console.log(`settimeout-usage-audit: ${path.join(reportsDir, 'settimeout_usage_audit.json')}`);
console.log(`settimeout-usage-audit: ${path.join(reportsDir, 'settimeout_usage_audit.md')}`);
