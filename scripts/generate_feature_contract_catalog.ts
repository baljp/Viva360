import fs from 'fs';
import path from 'path';
import { flowRegistry } from '../src/flow/registry';
import { FLOW_PERSISTENCE_EVIDENCE } from './persistence_evidence_catalog';

type MatrixEntry = {
  flowIds?: string[];
  persistenciaClassificacao?: 'P0' | 'P1' | 'P2';
  persistenciaEscopo?: string;
};

type MatrixReport = {
  entries: MatrixEntry[];
};

const reportsDir = path.resolve(process.cwd(), 'reports');
if (!fs.existsSync(reportsDir)) fs.mkdirSync(reportsDir, { recursive: true });

const matrixPath = path.join(reportsDir, 'screen_button_flow_matrix.json');
let matrix: MatrixReport | null = null;
if (fs.existsSync(matrixPath)) {
  matrix = JSON.parse(fs.readFileSync(matrixPath, 'utf8')) as MatrixReport;
}

const entriesByFlow = new Map<string, MatrixEntry[]>();
for (const entry of matrix?.entries || []) {
  for (const flowId of entry.flowIds || []) {
    const list = entriesByFlow.get(flowId) || [];
    list.push(entry);
    entriesByFlow.set(flowId, list);
  }
}

const catalog = flowRegistry.map((flow) => {
  const matrixEntries = entriesByFlow.get(flow.id) || [];
  const persistCounts = {
    P0: matrixEntries.filter((e) => e.persistenciaClassificacao === 'P0').length,
    P1: matrixEntries.filter((e) => e.persistenciaClassificacao === 'P1').length,
    P2: matrixEntries.filter((e) => e.persistenciaClassificacao === 'P2').length,
  };
  const escopos = Array.from(new Set(matrixEntries.map((e) => e.persistenciaEscopo).filter(Boolean)));

  const contractType = flow.clientOnly
    ? 'CLIENT_ONLY'
    : FLOW_PERSISTENCE_EVIDENCE[flow.id]
      ? 'PERSISTIDO_VALIDADO'
    : (persistCounts.P2 > 0 && persistCounts.P1 === 0 && persistCounts.P0 === 0)
      ? 'PERSISTIDO_VALIDADO'
      : (persistCounts.P2 > 0 || persistCounts.P1 > 0)
        ? 'MISTO_OU_PARCIAL'
        : 'NAO_CLASSIFICADO';

  return {
    id: flow.id,
    profile: flow.profile,
    title: flow.title,
    contractType,
    clientOnly: !!flow.clientOnly,
    screens: flow.screens,
    endpoints: flow.endpoints,
    expectedFinal: flow.expectedFinal,
    fallbackScreen: flow.fallbackScreen,
    persistence: {
      counts: persistCounts,
      escopos,
      matrixEntries: matrixEntries.length,
    },
    productContract: {
      persistencePromise: flow.clientOnly
        ? 'Fluxo local/intencional (sem persistência backend)'
        : 'Fluxo com persistência/integração backend esperada conforme endpoints mapeados',
      userVisibleOutcome: flow.expectedFinal,
      rollbackPath: flow.fallbackScreen,
    },
    validationEvidence: FLOW_PERSISTENCE_EVIDENCE[flow.id] || null,
  };
});

const summary = {
  generatedAt: new Date().toISOString(),
  source: {
    flowRegistry: 'src/flow/registry.ts',
    matrixReport: fs.existsSync(matrixPath) ? 'reports/screen_button_flow_matrix.json' : null,
  },
  totals: {
    flows: catalog.length,
    clientOnly: catalog.filter((c) => c.clientOnly).length,
    persistedValidated: catalog.filter((c) => c.contractType === 'PERSISTIDO_VALIDADO').length,
    mixedOrPartial: catalog.filter((c) => c.contractType === 'MISTO_OU_PARCIAL').length,
    unclassified: catalog.filter((c) => c.contractType === 'NAO_CLASSIFICADO').length,
    flowValidatedByEvidenceCatalog: catalog.filter((c) => !!c.validationEvidence).length,
  },
  catalog,
};

const outJson = path.join(reportsDir, 'feature_contract_catalog.json');
const outMd = path.join(reportsDir, 'feature_contract_catalog.md');

fs.writeFileSync(outJson, JSON.stringify(summary, null, 2), 'utf8');

const lines = [
  '# Catálogo de Contrato de Features (clientOnly vs persistidas)',
  '',
  `Gerado em: ${summary.generatedAt}`,
  '',
  `Flows totais: ${summary.totals.flows}`,
  `Client-only: ${summary.totals.clientOnly}`,
  `Persistidos validados: ${summary.totals.persistedValidated}`,
  `Mistos/parciais: ${summary.totals.mixedOrPartial}`,
  `Não classificados: ${summary.totals.unclassified}`,
  `Validados por catálogo de evidência: ${summary.totals.flowValidatedByEvidenceCatalog}`,
  '',
  '| Flow ID | Perfil | Tipo de contrato | ClientOnly | Final esperado | Endpoints | Persistência (P0/P1/P2) | Evidência explícita |',
  '|---|---|---|---|---|---|---|---|',
];

for (const item of catalog) {
  lines.push(
    `| ${item.id} | ${item.profile} | ${item.contractType} | ${item.clientOnly ? 'Sim' : 'Não'} | ${item.expectedFinal} | ${item.endpoints.join(', ') || '—'} | ${item.persistence.counts.P0}/${item.persistence.counts.P1}/${item.persistence.counts.P2} | ${item.validationEvidence ? 'Sim' : 'Não'} |`,
  );
}

fs.writeFileSync(outMd, `${lines.join('\n')}\n`, 'utf8');

console.log(`feature-contract-catalog: ${outJson}`);
console.log(`feature-contract-catalog: ${outMd}`);
