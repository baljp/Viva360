import fs from 'fs';
import path from 'path';

type Report = {
  totals?: {
    riskyRuntime?: number;
    runtimeFrontend?: number;
    runtimeBackend?: number;
  };
};

const reportPath = path.resolve(process.cwd(), 'reports/mock_reference_inventory.json');
if (!fs.existsSync(reportPath)) {
  console.error(`mock-reference-gate: relatório ausente (${reportPath}). Rode 'npm run qa:audit-mock-refs'.`);
  process.exit(1);
}

const report = JSON.parse(fs.readFileSync(reportPath, 'utf8')) as Report;
const riskyRuntime = Number(report.totals?.riskyRuntime || 0);
console.log(`mock-reference-gate: riskyRuntime=${riskyRuntime}`);

if (riskyRuntime > 0) {
  console.error('mock-reference-gate: FAIL (mock leak patterns de runtime fora da allowlist)');
  process.exit(1);
}

console.log('mock-reference-gate: PASS');
