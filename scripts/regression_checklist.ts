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
  { id: 'flow-registry', label: 'Validação do Flow Registry', command: 'npm run qa:validate-flow-registry', required: true },
  { id: 'tracked-secrets', label: 'Auditoria de secrets versionados', command: 'npm run qa:audit-tracked-secrets', required: true },
  { id: 'prod-bundle', label: 'Auditoria de bundle frontend em production', command: 'npm run build && npm run qa:audit-prod-bundle', required: true },
  { id: 'routes', label: 'Auditoria de rotas/imports', command: 'node scripts/audit_routes.cjs', required: true },
  { id: 'route-leaks', label: 'Auditoria de vazamento de rotas teste/mock', command: 'npm run qa:audit-route-leaks', required: true },
  { id: 'buttons', label: 'Auditoria de botoes sem handler', command: 'npx tsx scripts/audit_buttons.ts --strict', required: true },
  { id: 'contracts', label: 'Contratos backend', command: 'npm run test:contracts', required: true },
  { id: 'oauth-policy', label: 'Política OAuth redirect/callback', command: 'npm run test:oauth-policy', required: true },
  { id: 'request-client', label: 'Request client unit (abort/timeout/retry)', command: 'npx vitest run services/api/requestClient.test.ts', required: true },
  { id: 'consent-e2e', label: 'E2E consentimento grant/revoke prontuario', command: 'npm run test:qa:consent', required: true },
  { id: 'deeplinks-e2e', label: 'E2E deep links por perfil', command: 'npm run test:qa:deeplinks', required: true },
  { id: 'a11y-smoke', label: 'QA acessibilidade smoke', command: 'npm run test:qa:a11y-smoke', required: true },
  { id: 'links-assets', label: 'Auditoria de links e imagens', command: 'npm run test:audit', required: true, retries: 1 },
];

if (runE2ECore) {
  checks.push({
    id: 'qa-core',
    label: 'QA core (sem visual/stress)',
    command: 'npm run test:qa:core',
    required: true,
    // Playwright retries are CI-gated in config; keep local checklist resilient to occasional flakes.
    retries: 1,
  });
}

const results: CheckResult[] = [];
const startedAt = new Date().toISOString();
const processStartedMs = Date.now();
const reportsDir = path.resolve(process.cwd(), 'reports');
if (!fs.existsSync(reportsDir)) fs.mkdirSync(reportsDir, { recursive: true });
const outJson = path.join(reportsDir, 'regression_checklist.json');
const outMd = path.join(reportsDir, 'regression_checklist.md');
const statusFile = path.join(reportsDir, 'regression_checklist.status.json');
const tmpJson = `${outJson}.tmp`;
const tmpMd = `${outMd}.tmp`;

// Marker for CI/ops to detect interrupted runs vs completed artifacts.
fs.writeFileSync(statusFile, JSON.stringify({
  status: 'running',
  generatedAt: startedAt,
  pid: process.pid,
}, null, 2), 'utf8');

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
const finishedAt = new Date().toISOString();
const payload = {
  generatedAt: startedAt,
  finishedAt,
  completed: true,
  durationMs: Date.now() - processStartedMs,
  ok: failedRequired.length === 0,
  requiredTotal: results.filter((r) => r.required).length,
  requiredPassed: results.filter((r) => r.required && r.ok).length,
  failedRequiredIds: failedRequired.map((r) => r.id),
  checks: results,
};

fs.writeFileSync(tmpJson, JSON.stringify(payload, null, 2), 'utf8');

const lines = [
  '# Regression Checklist',
  '',
  `Iniciado em: ${payload.generatedAt}`,
  `Finalizado em: ${payload.finishedAt}`,
  `Status geral: ${payload.ok ? 'PASS' : 'FAIL'}`,
  `Checks obrigatórios: ${payload.requiredPassed}/${payload.requiredTotal}`,
  '',
  '| Check | Status | Duracao (ms) | Comando |',
  '|---|---|---:|---|',
  ...results.map((result) => `| ${result.label} | ${result.ok ? 'PASS' : 'FAIL'} | ${result.durationMs} | \`${result.command}\` |`),
];
fs.writeFileSync(tmpMd, `${lines.join('\n')}\n`, 'utf8');

fs.renameSync(tmpJson, outJson);
fs.renameSync(tmpMd, outMd);
fs.writeFileSync(statusFile, JSON.stringify({
  status: payload.ok ? 'completed_pass' : 'completed_fail',
  generatedAt: startedAt,
  finishedAt,
  completed: true,
  ok: payload.ok,
  requiredPassed: payload.requiredPassed,
  requiredTotal: payload.requiredTotal,
}, null, 2), 'utf8');

console.log(`checklist: ${payload.ok ? 'PASS' : 'FAIL'}`);
console.log(`checklist: ${outJson}`);
console.log(`checklist: ${outMd}`);

if (!payload.ok) {
  process.exit(1);
}
