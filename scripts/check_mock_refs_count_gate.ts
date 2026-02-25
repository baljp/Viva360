/**
 * qa:mock-refs-count-gate
 *
 * Conta referências a "mock" e "fake" no código de produção (excluindo arquivos
 * intrinsecamente mock, tests e scripts) e falha se o total superar o threshold.
 *
 * Limites progressivos documentados:
 *   Audit v2  → 439 refs (baseline)
 *   Audit v3  → ~400 refs (refactor de consolidação)
 *   Meta 30d  → < 300 refs (consolidação completa)
 *
 * Threshold atual: MOCK_REF_THRESHOLD (configurável via env ou hard-coded abaixo).
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

// ─── Configuração ─────────────────────────────────────────────────────────────

const THRESHOLD = Number(process.env.MOCK_REF_THRESHOLD || 420);

/**
 * Arquivos/pastas cujos refs são INTRÍNSECOS (o arquivo É mock por natureza)
 * ou são infraestrutura de teste — não devem ser contados no gate de produção.
 */
const EXCLUDE_PATTERNS = [
  'node_modules',
  '.test.',
  '.spec.',
  '/scripts/',
  'mockAdapter.ts',
  'mock.ts',
  'mockData.service.ts',
  'mock-fixtures.ts',
  'seedEngine.ts',
  'e2e_flow.ts',
  'e2e_refactor.ts',
  'e2e_excellence',
  'check_interactions',
  'check_endpoints',
  'validate_',
  'playwright.',
  'qa/utils/',
  'src/data/mock',
];

// ─── Contagem ─────────────────────────────────────────────────────────────────

function countMockRefs(): { total: number; byFile: Array<{ file: string; count: number }> } {
  const result = execSync(
    `grep -ri "mock\\|fake" --include="*.ts" --include="*.tsx" -l`,
    { cwd: process.cwd(), encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }
  ).trim();

  const files = result.split('\n').filter(Boolean);

  const byFile: Array<{ file: string; count: number }> = [];
  let total = 0;

  for (const file of files) {
    // Excluir arquivos intrínsecos / de teste
    const isExcluded = EXCLUDE_PATTERNS.some((pat) => file.includes(pat));
    if (isExcluded) continue;

    let count: number;
    try {
      const output = execSync(
        `grep -ci "mock\\|fake" "${file}"`,
        { cwd: process.cwd(), encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }
      ).trim();
      count = Number(output) || 0;
    } catch {
      // grep returns exit code 1 when no match — ignore
      count = 0;
    }

    if (count > 0) {
      byFile.push({ file, count });
      total += count;
    }
  }

  byFile.sort((a, b) => b.count - a.count);
  return { total, byFile };
}

// ─── Relatório ────────────────────────────────────────────────────────────────

const { total, byFile } = countMockRefs();

const report = {
  generatedAt: new Date().toISOString(),
  threshold: THRESHOLD,
  total,
  pass: total <= THRESHOLD,
  topFiles: byFile.slice(0, 20),
  note: [
    'Arquivos intrínsecos excluídos: mockAdapter.ts, mock.ts, mockData.service.ts,',
    'mock-fixtures.ts, seedEngine.ts, scripts/, e2e_*.ts, playwright.*.ts.',
    `Meta: < 300 refs (redução progressiva de ${total} → 300 em ~1 mês).`,
  ].join(' '),
};

const reportsDir = path.resolve(process.cwd(), 'reports');
if (!fs.existsSync(reportsDir)) fs.mkdirSync(reportsDir, { recursive: true });
fs.writeFileSync(
  path.resolve(reportsDir, 'mock_ref_count_gate.json'),
  JSON.stringify(report, null, 2),
  'utf8'
);

// ─── Saída ────────────────────────────────────────────────────────────────────

console.log(`\nmock-refs-count-gate: total=${total} threshold=${THRESHOLD}`);
console.log('\nTop 10 arquivos:');
byFile.slice(0, 10).forEach(({ file, count }) => {
  console.log(`  ${String(count).padStart(4)}  ${file}`);
});

if (total > THRESHOLD) {
  console.error(
    `\nmock-refs-count-gate: FAIL — ${total} refs > threshold ${THRESHOLD}.` +
    `\n  Reduza refs ou ajuste MOCK_REF_THRESHOLD com justificativa em reports/mock_ref_count_gate.json.`
  );
  process.exit(1);
}

console.log(`\nmock-refs-count-gate: PASS (${total} ≤ ${THRESHOLD})`);
