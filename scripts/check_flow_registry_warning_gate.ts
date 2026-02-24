import fs from 'fs';
import path from 'path';

type Finding = { level?: string; message?: string };
type Report = { findings?: Finding[] };

const reportPath = path.resolve(process.cwd(), 'reports/flow_registry_validation.json');
const MAX_WARNINGS = 9;

if (!fs.existsSync(reportPath)) {
  console.error(`flow-registry-warn-gate: relatório ausente (${reportPath}). Rode 'npm run qa:validate-flow-registry'.`);
  process.exit(1);
}

const report = JSON.parse(fs.readFileSync(reportPath, 'utf8')) as Report;
const findings = Array.isArray(report.findings) ? report.findings : [];
const warnings = findings.filter((f) => String(f.level || '').toUpperCase() === 'WARN');
const errors = findings.filter((f) => String(f.level || '').toUpperCase() === 'ERROR');

const categories = {
  expectedFinalMismatch: warnings.filter((f) => String(f.message || '').includes('difere de expectedFinal')).length,
  narrativeJump: warnings.filter((f) => String(f.message || '').includes('Salto narrativo/multi-etapas')).length,
  otherWarns: warnings.filter((f) =>
    !String(f.message || '').includes('difere de expectedFinal') &&
    !String(f.message || '').includes('Salto narrativo/multi-etapas'),
  ).length,
};

console.log(`flow-registry-warn-gate: errors=${errors.length} warns=${warnings.length} max=${MAX_WARNINGS}`);
console.log(`flow-registry-warn-gate: ${JSON.stringify(categories)}`);

if (errors.length > 0) {
  console.error('flow-registry-warn-gate: FAIL (errors presentes)');
  process.exit(1);
}
if (warnings.length > MAX_WARNINGS) {
  console.error('flow-registry-warn-gate: FAIL (warnings acima do baseline)');
  process.exit(1);
}
if (categories.otherWarns > 0) {
  console.error('flow-registry-warn-gate: FAIL (warning fora das categorias conhecidas)');
  process.exit(1);
}

console.log('flow-registry-warn-gate: PASS');

