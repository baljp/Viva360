import fs from 'fs';
import path from 'path';

const reportPath = path.join(process.cwd(), 'reports', 'settimeout_usage_audit.json');
if (!fs.existsSync(reportPath)) {
  console.error('settimeout gate: missing report. Run npm run qa:audit-settimeout-usage first.');
  process.exit(1);
}

const report = JSON.parse(fs.readFileSync(reportPath, 'utf8')) as {
  totals?: { runtime?: number; frontendRuntime?: number; backendRuntime?: number };
};

const runtime = Number(report.totals?.runtime || 0);
const frontendRuntime = Number(report.totals?.frontendRuntime || 0);
const backendRuntime = Number(report.totals?.backendRuntime || 0);

// Baseline gate to prevent silent growth; not a ban.
const MAX_RUNTIME = 59;
const MAX_FRONTEND_RUNTIME = 45;
const MAX_BACKEND_RUNTIME = 8;

const violations: string[] = [];
if (runtime > MAX_RUNTIME) violations.push(`runtime ${runtime} > ${MAX_RUNTIME}`);
if (frontendRuntime > MAX_FRONTEND_RUNTIME) violations.push(`frontendRuntime ${frontendRuntime} > ${MAX_FRONTEND_RUNTIME}`);
if (backendRuntime > MAX_BACKEND_RUNTIME) violations.push(`backendRuntime ${backendRuntime} > ${MAX_BACKEND_RUNTIME}`);

console.log(`settimeout gate: runtime=${runtime}, frontendRuntime=${frontendRuntime}, backendRuntime=${backendRuntime}`);

if (violations.length > 0) {
  console.error(`settimeout gate FAIL: ${violations.join('; ')}`);
  process.exit(1);
}
