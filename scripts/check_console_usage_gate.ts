import fs from 'fs';
import path from 'path';

type Report = {
  totals?: {
    frontendConsoleLog?: number;
    runtimeOutsideAllowlist?: number;
  };
};

const MAX_RUNTIME_CONSOLE = Number(process.env.CONSOLE_RUNTIME_MAX || 200);

const reportPath = path.resolve(process.cwd(), 'reports/console_usage_audit.json');
if (!fs.existsSync(reportPath)) {
  console.error(`console-usage-gate: relatório ausente (${reportPath}). Rode 'npm run qa:audit-console-usage'.`);
  process.exit(1);
}

const report = JSON.parse(fs.readFileSync(reportPath, 'utf8')) as Report;
const frontendConsoleLog = Number(report.totals?.frontendConsoleLog || 0);
const runtimeOutsideAllowlist = Number(report.totals?.runtimeOutsideAllowlist || 0);

console.log(`console-usage-gate: frontendConsoleLog=${frontendConsoleLog}`);
console.log(`console-usage-gate: runtimeOutsideAllowlist=${runtimeOutsideAllowlist} max=${MAX_RUNTIME_CONSOLE}`);

if (frontendConsoleLog > 0) {
  console.error('console-usage-gate: FAIL (console.log no runtime frontend fora do logger central)');
  process.exit(1);
}

if (runtimeOutsideAllowlist > MAX_RUNTIME_CONSOLE) {
  console.error(`console-usage-gate: FAIL (runtime console fora da allowlist ${runtimeOutsideAllowlist} > ${MAX_RUNTIME_CONSOLE})`);
  process.exit(1);
}

console.log('console-usage-gate: PASS');
