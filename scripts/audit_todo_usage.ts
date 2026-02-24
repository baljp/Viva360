import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

type Match = { file: string; line: number; kind: 'TODO' | 'FIXME'; text: string };

const cwd = process.cwd();
const reportsDir = path.join(cwd, 'reports');
if (!fs.existsSync(reportsDir)) fs.mkdirSync(reportsDir, { recursive: true });

const raw = execSync(
  "rg -n --no-heading '\\b(TODO|FIXME)\\b' --glob '!node_modules/**' --glob '!dist/**' .",
  { cwd, stdio: ['ignore', 'pipe', 'pipe'], encoding: 'utf8' },
);

const matches: Match[] = raw
  .split('\n')
  .map((line) => line.trim())
  .filter(Boolean)
  .map((line) => {
    const [file, lineNo, ...rest] = line.split(':');
    const text = rest.join(':').trim();
    return {
      file: file.replace(/^\.\//, ''),
      line: Number(lineNo || 0),
      kind: /FIXME/.test(text) ? 'FIXME' : 'TODO',
      text,
    };
  });

const isNonProdPath = (f: string) =>
  f.startsWith('qa/') ||
  f.startsWith('scripts/') ||
  f.startsWith('reports/') ||
  f.endsWith('.md') ||
  f.endsWith('.txt') ||
  f.endsWith('.json') ||
  f.includes('/tests/');

const runtime = matches.filter((m) => !isNonProdPath(m.file));
const byFile = runtime.reduce<Record<string, number>>((acc, m) => {
  acc[m.file] = (acc[m.file] || 0) + 1;
  return acc;
}, {});

const payload = {
  generatedAt: new Date().toISOString(),
  totals: {
    allMatches: matches.length,
    runtime: runtime.length,
  },
  runtimeMatches: runtime,
  byFile,
};

fs.writeFileSync(path.join(reportsDir, 'todo_usage_audit.json'), JSON.stringify(payload, null, 2));
const md = [
  '# TODO/FIXME Audit',
  '',
  `Gerado em: ${payload.generatedAt}`,
  '',
  `Total (repo): ${payload.totals.allMatches}`,
  `Runtime: ${payload.totals.runtime}`,
  '',
  '## Runtime matches',
  ...runtime.map((m) => `- ${m.file}:${m.line} [${m.kind}] ${m.text}`),
  '',
];
fs.writeFileSync(path.join(reportsDir, 'todo_usage_audit.md'), `${md.join('\n')}\n`);

console.log(`todo-usage-audit: ${path.join(reportsDir, 'todo_usage_audit.json')}`);
console.log(`todo-usage-audit: ${path.join(reportsDir, 'todo_usage_audit.md')}`);
