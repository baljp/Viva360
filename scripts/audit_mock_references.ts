import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

type Match = { file: string; line: number; text: string };

const cwd = process.cwd();
const reportsDir = path.join(cwd, 'reports');
if (!fs.existsSync(reportsDir)) fs.mkdirSync(reportsDir, { recursive: true });

const rgCmd =
  "rg -n --no-heading '\\b(mock|Mock|fake|Fake)\\b' --glob '!node_modules/**' --glob '!dist/**' --glob '!**/*.test.*' --glob '!**/*.spec.*' .";

const raw = execSync(rgCmd, { cwd, stdio: ['ignore', 'pipe', 'pipe'], encoding: 'utf8' });
const matches: Match[] = raw
  .split('\n')
  .map((line) => line.trim())
  .filter(Boolean)
  .map((line) => {
    const [file, lineNo, ...rest] = line.split(':');
    return { file, line: Number(lineNo || 0), text: rest.join(':').trim() };
  });

const norm = (f: string) => f.replace(/^\.\//, '');
const isDoc = (f: string) => /\.(md|txt)$/i.test(f) || f.startsWith('reports/');
const isScript = (f: string) =>
  f.startsWith('scripts/')
  || f.startsWith('backend/scripts/')
  || f.startsWith('qa/')
  || f.startsWith('backend/e2e')
  || f.startsWith('backend/check_');
const isRuntimeBackend = (f: string) => f.startsWith('backend/src/');
const isRuntimeFrontend = (f: string) =>
  f.startsWith('views/') || f.startsWith('src/') || f.startsWith('services/') || f.startsWith('lib/') || f.startsWith('components/');

const allowlistedRuntimePatterns = [
  /services\/api\/mock\.ts$/,
  /backend\/src\/middleware\/auth\.middleware\.ts$/,
  /backend\/src\/services\/supabase\.service\.ts$/,
  /backend\/src\/lib\/secrets\.ts$/,
  /backend\/src\/lib\/runtimeGuard\.ts$/,
  /backend\/src\/lib\/createBaseApiApp\.ts$/,
];

const dangerousLeakPatterns = [
  /bearer mock-token/i,
  /mock tokens are forbidden in production/i,
  /session\.mode'.*mock/i,
  /viva360\.session\.mode.*mock/i,
];

const categorized = {
  runtimeFrontend: [] as Match[],
  runtimeBackend: [] as Match[],
  docs: [] as Match[],
  scriptsQa: [] as Match[],
  other: [] as Match[],
};

for (const m of matches) {
  const file = norm(m.file);
  const entry = { ...m, file };
  if (isDoc(file)) categorized.docs.push(entry);
  else if (isScript(file)) categorized.scriptsQa.push(entry);
  else if (isRuntimeBackend(file)) categorized.runtimeBackend.push(entry);
  else if (isRuntimeFrontend(file)) categorized.runtimeFrontend.push(entry);
  else categorized.other.push(entry);
}

const riskyRuntime = [...categorized.runtimeBackend, ...categorized.runtimeFrontend].filter((m) => {
  const fileAllowed = allowlistedRuntimePatterns.some((p) => p.test(m.file));
  const dangerousText = dangerousLeakPatterns.some((p) => p.test(m.text));
  if (dangerousText && !fileAllowed) return true;
  return false;
});

const payload = {
  generatedAt: new Date().toISOString(),
  totals: {
    all: matches.length,
    runtimeFrontend: categorized.runtimeFrontend.length,
    runtimeBackend: categorized.runtimeBackend.length,
    docs: categorized.docs.length,
    scriptsQa: categorized.scriptsQa.length,
    other: categorized.other.length,
    riskyRuntime: riskyRuntime.length,
  },
  allowlistedRuntimePatterns: allowlistedRuntimePatterns.map(String),
  riskyRuntime,
  samples: {
    runtimeFrontend: categorized.runtimeFrontend.slice(0, 30),
    runtimeBackend: categorized.runtimeBackend.slice(0, 30),
    docs: categorized.docs.slice(0, 20),
    scriptsQa: categorized.scriptsQa.slice(0, 20),
  },
};

fs.writeFileSync(path.join(reportsDir, 'mock_reference_inventory.json'), JSON.stringify(payload, null, 2));

const md = [
  '# Mock Reference Inventory',
  '',
  `Gerado em: ${payload.generatedAt}`,
  '',
  `Total: ${payload.totals.all}`,
  `Runtime frontend: ${payload.totals.runtimeFrontend}`,
  `Runtime backend: ${payload.totals.runtimeBackend}`,
  `Docs/reports: ${payload.totals.docs}`,
  `Scripts/QA: ${payload.totals.scriptsQa}`,
  `Outros: ${payload.totals.other}`,
  `Risco runtime (leak patterns fora da allowlist): ${payload.totals.riskyRuntime}`,
  '',
  '| File | Line | Match |',
  '|---|---:|---|',
  ...riskyRuntime.slice(0, 100).map((m) => `| ${m.file} | ${m.line} | ${m.text.replace(/\|/g, '\\|')} |`),
];
fs.writeFileSync(path.join(reportsDir, 'mock_reference_inventory.md'), `${md.join('\n')}\n`);

console.log(`mock-reference-inventory: ${path.join(reportsDir, 'mock_reference_inventory.json')}`);
console.log(`mock-reference-inventory: ${path.join(reportsDir, 'mock_reference_inventory.md')}`);
