import fs from 'fs';
import path from 'path';

const reportPath = path.join(process.cwd(), 'reports', 'todo_usage_audit.json');
if (!fs.existsSync(reportPath)) {
  console.error('todo gate: missing report. Run npm run qa:audit-todo-usage first.');
  process.exit(1);
}

const report = JSON.parse(fs.readFileSync(reportPath, 'utf8')) as {
  totals?: { runtime?: number };
  runtimeMatches?: Array<{ file: string }>;
};

const runtime = Number(report.totals?.runtime || 0);
const allowlisted = new Set([
  'backend/src/controllers/admin.controller.ts',
]);
const disallowed = (report.runtimeMatches || []).filter((m) => !allowlisted.has(m.file));

console.log(`todo gate: runtime=${runtime}, disallowed=${disallowed.length}`);
if (disallowed.length > 0) {
  console.error('todo gate FAIL: runtime TODO/FIXME outside allowlist');
  process.exit(1);
}
if (runtime > allowlisted.size) {
  console.error(`todo gate FAIL: runtime TODO/FIXME count ${runtime} > allowlisted ${allowlisted.size}`);
  process.exit(1);
}
