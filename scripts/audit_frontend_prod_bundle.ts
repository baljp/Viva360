import fs from 'fs';
import path from 'path';

type Finding = {
  level: 'ERROR';
  file: string;
  reason: string;
};

const strictMode = process.argv.includes('--strict');
const distAssets = path.resolve(process.cwd(), 'dist', 'assets');
const findings: Finding[] = [];

const pushFinding = (finding: Finding) => findings.push(finding);

const readJsFiles = (dir: string): string[] => {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter((entry) => entry.endsWith('.js'))
    .map((entry) => path.join(dir, entry));
};

const jsFiles = readJsFiles(distAssets);
if (jsFiles.length === 0) {
  pushFinding({
    level: 'ERROR',
    file: 'dist/assets',
    reason: 'Nenhum arquivo JS encontrado no bundle. Rode `npm run build` antes da auditoria.',
  });
}

let foundProductionModeLiteral = false;

for (const filePath of jsFiles) {
  const content = fs.readFileSync(filePath, 'utf8');
  const relativePath = path.relative(process.cwd(), filePath);

  if (content.includes('jsxDEV(')) {
    pushFinding({
      level: 'ERROR',
      file: relativePath,
      reason: 'Bundle contém `jsxDEV(` (indicador de build em modo desenvolvimento).',
    });
  }

  if (/MODE:"production"/.test(content)) {
    foundProductionModeLiteral = true;
  }

  if (/MODE:"production"[\s\S]{0,240}PROD:!1/.test(content) || /MODE:"production"[\s\S]{0,240}PROD:false/.test(content)) {
    pushFinding({
      level: 'ERROR',
      file: relativePath,
      reason: 'Bundle indica MODE=production com PROD=false (configuração inconsistente).',
    });
  }

  if (/MODE:"production"[\s\S]{0,240}DEV:!0/.test(content) || /MODE:"production"[\s\S]{0,240}DEV:true/.test(content)) {
    pushFinding({
      level: 'ERROR',
      file: relativePath,
      reason: 'Bundle indica MODE=production com DEV=true (configuração inconsistente).',
    });
  }
}

if (!foundProductionModeLiteral && jsFiles.length > 0) {
  pushFinding({
    level: 'ERROR',
    file: 'dist/assets',
    reason: 'Não foi possível confirmar MODE=production no bundle gerado.',
  });
}

const reportsDir = path.resolve(process.cwd(), 'reports');
if (!fs.existsSync(reportsDir)) fs.mkdirSync(reportsDir, { recursive: true });

const payload = {
  generatedAt: new Date().toISOString(),
  strictMode,
  findings,
  ok: findings.length === 0,
};

const outJson = path.join(reportsDir, 'frontend_prod_bundle_audit.json');
const outMd = path.join(reportsDir, 'frontend_prod_bundle_audit.md');
fs.writeFileSync(outJson, JSON.stringify(payload, null, 2), 'utf8');

const mdLines = [
  '# Frontend Production Bundle Audit',
  '',
  `Generated at: ${payload.generatedAt}`,
  `Status: ${payload.ok ? 'PASS' : 'FAIL'}`,
  '',
  '| Level | File | Reason |',
  '|---|---|---|',
  ...findings.map((finding) => `| ${finding.level} | ${finding.file} | ${finding.reason} |`),
];
fs.writeFileSync(outMd, `${mdLines.join('\n')}\n`, 'utf8');

if (payload.ok) {
  console.log('frontend-prod-bundle-audit: PASS');
  console.log(`frontend-prod-bundle-audit: ${outJson}`);
  console.log(`frontend-prod-bundle-audit: ${outMd}`);
  process.exit(0);
}

console.log(`frontend-prod-bundle-audit: FAIL (${findings.length} findings)`);
for (const finding of findings) {
  console.log(`- [${finding.level}] ${finding.file} ${finding.reason}`);
}
console.log(`frontend-prod-bundle-audit: ${outJson}`);
console.log(`frontend-prod-bundle-audit: ${outMd}`);

if (strictMode) process.exit(1);
process.exit(0);
