import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

type Match = { file: string; line: number; method: string; text: string };

const cwd = process.cwd();
const reportsDir = path.join(cwd, 'reports');
if (!fs.existsSync(reportsDir)) fs.mkdirSync(reportsDir, { recursive: true });

const rgCmd =
  "rg -n --no-heading 'console\\.(log|debug|info|warn|error)\\(' --glob '!node_modules/**' --glob '!dist/**' --glob '!**/*.test.*' --glob '!**/*.spec.*' .";
const raw = execSync(rgCmd, { cwd, stdio: ['ignore', 'pipe', 'pipe'], encoding: 'utf8' });
const matches: Match[] = raw
  .split('\n')
  .map((line) => line.trim())
  .filter(Boolean)
  .map((line) => {
    const [file, lineNo, ...rest] = line.split(':');
    const text = rest.join(':').trim();
    const methodMatch = text.match(/console\.(log|debug|info|warn|error)\(/);
    return { file: file.replace(/^\.\//, ''), line: Number(lineNo || 0), method: methodMatch?.[1] || 'unknown', text };
  });

const isNonProdPath = (f: string) =>
  f === 'validate-env.ts'
  || f.startsWith('qa/')
  || f.startsWith('scripts/')
  || f.startsWith('backend/scripts/')
  || f.startsWith('backend/tests/')
  || f.startsWith('backend/test_')
  || f.startsWith('backend/validate_')
  || f.startsWith('backend/benchmark')
  || f.startsWith('backend/smoke_')
  || f.startsWith('reports/')
  || f.startsWith('backend/e2e')
  || f.startsWith('backend/check_');
const isBackendRuntime = (f: string) => f.startsWith('backend/src/');
const isFrontendRuntime = (f: string) =>
  (f.startsWith('src/') || f.startsWith('views/') || f.startsWith('services/') || f.startsWith('components/') || f === 'index.tsx')
  && !f.startsWith('backend/src/');

const allowlisted = [
  'backend/src/lib/logger.ts', // canonical backend sink
];

const runtime = matches.filter((m) => !isNonProdPath(m.file));
const frontendRuntime = runtime.filter((m) => isFrontendRuntime(m.file));
const backendRuntime = runtime.filter((m) => isBackendRuntime(m.file));
const disallowedConsoleLogFrontend = frontendRuntime.filter((m) => m.method === 'log');
const disallowedConsoleRuntime = runtime.filter((m) => !allowlisted.includes(m.file));

const byMethod = runtime.reduce<Record<string, number>>((acc, m) => {
  acc[m.method] = (acc[m.method] || 0) + 1;
  return acc;
}, {});

const payload = {
  generatedAt: new Date().toISOString(),
  totals: {
    allMatches: matches.length,
    runtime: runtime.length,
    frontendRuntime: frontendRuntime.length,
    backendRuntime: backendRuntime.length,
    frontendConsoleLog: disallowedConsoleLogFrontend.length,
    runtimeOutsideAllowlist: disallowedConsoleRuntime.length,
  },
  byMethod,
  allowlisted,
  disallowedSamples: {
    frontendConsoleLog: disallowedConsoleLogFrontend.slice(0, 50),
    runtimeOutsideAllowlist: disallowedConsoleRuntime.slice(0, 50),
  },
};

fs.writeFileSync(path.join(reportsDir, 'console_usage_audit.json'), JSON.stringify(payload, null, 2));
const md = [
  '# Console Usage Audit',
  '',
  `Gerado em: ${payload.generatedAt}`,
  '',
  `Runtime total: ${payload.totals.runtime}`,
  `Frontend runtime: ${payload.totals.frontendRuntime}`,
  `Backend runtime: ${payload.totals.backendRuntime}`,
  `Frontend console.log (disallow target): ${payload.totals.frontendConsoleLog}`,
  `Runtime console fora da allowlist: ${payload.totals.runtimeOutsideAllowlist}`,
  '',
  `Métodos: ${JSON.stringify(byMethod)}`,
  '',
];
fs.writeFileSync(path.join(reportsDir, 'console_usage_audit.md'), `${md.join('\n')}\n`);

console.log(`console-usage-audit: ${path.join(reportsDir, 'console_usage_audit.json')}`);
console.log(`console-usage-audit: ${path.join(reportsDir, 'console_usage_audit.md')}`);
