import fs from 'fs';
import path from 'path';

type FeatureCatalogEntry = {
  id: string;
  profile: string;
  title?: string;
  contractType?: string;
  clientOnly?: boolean;
  screens?: string[];
  endpoints?: string[];
  expectedFinal?: string;
};

type FeatureCatalogReport = {
  catalog?: FeatureCatalogEntry[];
};

const inputPath = path.resolve(process.cwd(), 'reports/feature_contract_catalog.json');
const outJson = path.resolve(process.cwd(), 'reports/flow_conversion_catalog.json');
const outMd = path.resolve(process.cwd(), 'reports/flow_conversion_catalog.md');

if (!fs.existsSync(inputPath)) {
  console.error(`flow-conversion-catalog: missing ${inputPath}. Run 'npm run qa:feature-contract-catalog' first.`);
  process.exit(1);
}

const report = JSON.parse(fs.readFileSync(inputPath, 'utf8')) as FeatureCatalogReport;
const catalog = Array.isArray(report.catalog) ? report.catalog : [];

const prioritized = catalog
  .filter((entry) => !entry.clientOnly)
  .map((entry) => {
    const screens = Array.from(new Set((entry.screens || []).filter(Boolean)));
    const stages = screens.map((screen, index) => ({
      index: index + 1,
      screen,
      eventKey: `${entry.profile.toLowerCase()}:${entry.id}:state:${screen}`,
      metricKeys: [
        `${entry.profile.toLowerCase()}.${entry.id}.attempt`,
        `${entry.profile.toLowerCase()}.${entry.id}.success`,
        `${entry.profile.toLowerCase()}.${entry.id}.error`,
      ],
    }));
    const coreType =
      String(entry.contractType || '').toUpperCase() === 'PERSISTIDO_VALIDADO'
        ? 'revenue_or_binding_ready'
        : 'mixed_validation';
    return {
      id: entry.id,
      profile: entry.profile,
      title: entry.title || entry.id,
      contractType: entry.contractType || 'UNKNOWN',
      expectedFinal: entry.expectedFinal || null,
      endpoints: entry.endpoints || [],
      funnelClass: coreType,
      stages,
    };
  })
  .sort((a, b) => {
    const score = (x: typeof a) => (x.contractType === 'PERSISTIDO_VALIDADO' ? 0 : 1);
    return score(a) - score(b) || a.id.localeCompare(b.id);
  });

const output = {
  generatedAt: new Date().toISOString(),
  source: 'reports/feature_contract_catalog.json',
  totals: {
    flows: prioritized.length,
    persistedValidated: prioritized.filter((f) => f.contractType === 'PERSISTIDO_VALIDADO').length,
    mixedOrPartial: prioritized.filter((f) => f.contractType !== 'PERSISTIDO_VALIDADO').length,
  },
  funnels: prioritized,
};

fs.writeFileSync(outJson, JSON.stringify(output, null, 2), 'utf8');

const mdLines = [
  '# Catálogo de Conversão por Fluxo',
  '',
  `Gerado em: ${output.generatedAt}`,
  `Flows: ${output.totals.flows}`,
  `Persistidos validados: ${output.totals.persistedValidated}`,
  `Mistos/parciais: ${output.totals.mixedOrPartial}`,
  '',
  '| Flow | Perfil | Contrato | Final esperado | Etapas |',
  '|---|---|---|---|---:|',
  ...prioritized.map((f) => `| ${f.id} | ${f.profile} | ${f.contractType} | ${f.expectedFinal || '—'} | ${f.stages.length} |`),
  '',
];
fs.writeFileSync(outMd, `${mdLines.join('\n')}\n`, 'utf8');

console.log('flow-conversion-catalog: PASS');
console.log(`flow-conversion-catalog: ${outJson}`);
console.log(`flow-conversion-catalog: ${outMd}`);
