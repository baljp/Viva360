import fs from 'fs';
import path from 'path';

type Report = {
  totals?: {
    frontendConsoleLog?: number;
    runtimeOutsideAllowlist?: number;
  };
};

const reportPath = path.resolve(process.cwd(), 'reports/console_usage_audit.json');
if (!fs.existsSync(reportPath)) {
  console.error(`console-usage-gate: relatório ausente (${reportPath}). Rode 'npm run qa:audit-console-usage'.`);
  process.exit(1);
}

const report = JSON.parse(fs.readFileSync(reportPath, 'utf8')) as Report;
const frontendConsoleLog = Number(report.totals?.frontendConsoleLog || 0);

console.log(`console-usage-gate: frontendConsoleLog=${frontendConsoleLog}`);

if (frontendConsoleLog > 0) {
  console.error('console-usage-gate: FAIL (console.log no runtime frontend fora do logger central)');
  process.exit(1);
}

console.log('console-usage-gate: PASS');
