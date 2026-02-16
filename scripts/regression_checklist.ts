import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';

type Check = {
  id: string;
  label: string;
  command: string;
  required: boolean;
  retries?: number;
};

type CheckResult = {
  id: string;
  label: string;
  command: string;
  required: boolean;
  ok: boolean;
  exitCode: number;
  durationMs: number;
  attempts: number;
};

const runE2ECore = String(process.env.SKIP_E2E_CORE || '').toLowerCase() !== 'true';

const checks: Check[] = [
  { id: 'matrix', label: 'Matriz Tela x Botao x Fluxo', command: 'npm run qa:matrix', required: true },
  { id: 'routes', label: 'Auditoria de rotas/imports', command: 'node scripts/audit_routes.cjs', required: true },
  { id: 'buttons', label: 'Auditoria de botoes sem handler', command: 'npx tsx scripts/audit_buttons.ts --strict', required: true },
  { id: 'contracts', label: 'Contratos backend', command: 'npm run test:contracts', required: true },
  { id: 'request-client', label: 'Request client unit (abort/timeout/retry)', command: 'npx vitest run services/api/requestClient.test.ts', required: true },
  { id: 'links-assets', label: 'Auditoria de links e imagens', command: 'npm run test:audit', required: true, retries: 1 },
];

if (runE2ECore) {
  checks.push({
    id: 'qa-core',
    label: 'QA core (sem visual/stress)',
    command: 'npm run test:qa:core',
    required: true,
  });
}

const results: CheckResult[] = [];

for (const check of checks) {
  const start = Date.now();
  const maxAttempts = (check.retries ?? 0) + 1;
  let attempts = 0;
  let lastExitCode = 1;
  let ok = false;

  while (attempts < maxAttempts && !ok) {
    attempts += 1;
    const result = spawnSync(check.command, {
      cwd: process.cwd(),
      shell: true,
      stdio: 'inherit',
      env: process.env,
    });
    lastExitCode = typeof result.status === 'number' ? result.status : 1;
    ok = lastExitCode === 0;
  }

  const durationMs = Date.now() - start;
  results.push({
    id: check.id,
    label: check.label,
    command: check.command,
    required: check.required,
    ok,
    exitCode: lastExitCode,
    durationMs,
    attempts,
  });
}

const failedRequired = results.filter((result) => result.required && !result.ok);
const payload = {
  generatedAt: new Date().toISOString(),
  ok: failedRequired.length === 0,
  checks: results,
};

const reportsDir = path.resolve(process.cwd(), 'reports');
if (!fs.existsSync(reportsDir)) fs.mkdirSync(reportsDir, { recursive: true });

const outJson = path.join(reportsDir, 'regression_checklist.json');
const outMd = path.join(reportsDir, 'regression_checklist.md');
fs.writeFileSync(outJson, JSON.stringify(payload, null, 2), 'utf8');

const lines = [
  '# Regression Checklist',
  '',
  `Gerado em: ${payload.generatedAt}`,
  `Status geral: ${payload.ok ? 'PASS' : 'FAIL'}`,
  '',
  '| Check | Status | Duracao (ms) | Comando |',
  '|---|---|---:|---|',
  ...results.map((result) => `| ${result.label} | ${result.ok ? 'PASS' : 'FAIL'} | ${result.durationMs} | \`${result.command}\` |`),
];
fs.writeFileSync(outMd, `${lines.join('\n')}\n`, 'utf8');

console.log(`checklist: ${payload.ok ? 'PASS' : 'FAIL'}`);
console.log(`checklist: ${outJson}`);
console.log(`checklist: ${outMd}`);

if (!payload.ok) {
  process.exit(1);
}
