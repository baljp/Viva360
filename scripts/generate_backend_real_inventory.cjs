const fs = require('fs');
const path = require('path');

const repoRoot = process.cwd();
const routeDir = path.join(repoRoot, 'backend/src/routes');
const domainsDir = path.join(repoRoot, 'services/api/domains');
const matrixJsonPath = path.join(repoRoot, 'reports/screen_button_flow_matrix.json');
const outJson = path.join(repoRoot, 'reports/backend_real_inventory.json');
const outMd = path.join(repoRoot, 'reports/backend_real_inventory.md');

const read = (file) => fs.readFileSync(file, 'utf8');
const routeFiles = fs.readdirSync(routeDir).filter((file) => file.endsWith('.ts'));

const mountMap = {};
const indexSource = read(path.join(routeDir, 'index.ts'));
for (const match of indexSource.matchAll(/router\.use\(\s*['"`]([^'"`]+)['"`]\s*,[\s\S]*?([a-zA-Z]+Routes)\s*\)/g)) {
  const mountPath = match[1];
  const routeImportName = match[2];
  const base = routeImportName.replace(/Routes$/, '').toLowerCase();
  mountMap[`${base}.routes.ts`] = mountPath;
}

const joinPath = (base, sub) => {
  const normalizedBase = base === '/' ? '' : base.replace(/\/$/, '');
  const normalizedSub = sub === '/' ? '' : sub.replace(/^\//, '');
  return `${normalizedBase}/${normalizedSub}`.replace(/\/+/g, '/');
};

const endpointInventory = [];
for (const file of routeFiles) {
  const filePath = path.join(routeDir, file);
  const source = read(filePath);
  const basePath = file === 'index.ts' ? '' : (mountMap[file] || `/${file.replace('.routes.ts', '')}`);
  for (const match of source.matchAll(/router\.(get|post|put|patch|delete)\(\s*['"`]([^'"`]+)['"`]/g)) {
    endpointInventory.push({
      method: match[1].toUpperCase(),
      path: file === 'index.ts' ? match[2] : joinPath(basePath, match[2]),
      file: path.relative(repoRoot, filePath),
    });
  }
}

endpointInventory.sort((a, b) => {
  if (a.path === b.path) return a.method.localeCompare(b.method);
  return a.path.localeCompare(b.path);
});

const domainFiles = fs.readdirSync(domainsDir).filter((file) => file.endsWith('.ts'));
const frontendContracts = [];
for (const file of domainFiles) {
  const filePath = path.join(domainsDir, file);
  const source = read(filePath);
  for (const match of source.matchAll(/request(?:<[^>]+>)?\(\s*([`'"])(.+?)\1/g)) {
    frontendContracts.push({
      path: match[2],
      file: path.relative(repoRoot, filePath),
    });
  }
}

const uniqueFrontendContracts = [...new Map(frontendContracts.map((item) => [`${item.path}::${item.file}`, item])).values()]
  .sort((a, b) => a.path.localeCompare(b.path));

const matrix = JSON.parse(read(matrixJsonPath));
const screensMap = new Map();
for (const row of matrix.entries || []) {
  const profile = row.profile || row.perfil;
  const screen = row.screen || row.tela;
  const persistence = row.persistence || row.persistenciaClassificacao;
  const scope = row.scope || row.persistenciaEscopo;
  const endpoints = row.endpoints || row.endpointsTocados || [];
  const flows = row.flows || row.flowIds || [];
  const key = `${profile}::${screen}`;
  const current = screensMap.get(key) || {
    profile,
    screen,
    persistence,
    scope,
    endpoints: new Set(),
    flows: new Set(),
  };
  const rank = { P0: 0, P1: 1, P2: 2 };
  const scopeRank = {
    alto_risco_sem_mapeamento: 0,
    backend_esperado_sem_evidencia_automatizada: 1,
    leitura_tolerante_fallback: 2,
    client_only_intencional: 3,
    critico_validado: 4,
  };
  if ((rank[persistence] ?? -1) > (rank[current.persistence] ?? -1)) current.persistence = persistence;
  if ((scopeRank[scope] ?? -1) > (scopeRank[current.scope] ?? -1)) current.scope = scope || current.scope;
  (Array.isArray(endpoints) ? endpoints : String(endpoints || '').split(',')).map((value) => String(value).trim()).filter(Boolean).forEach((value) => current.endpoints.add(value));
  (Array.isArray(flows) ? flows : String(flows || '').split(',')).map((value) => String(value).trim()).filter(Boolean).forEach((value) => current.flows.add(value));
  screensMap.set(key, current);
}

const screens = [...screensMap.values()].map((screen) => ({
  profile: screen.profile,
  screen: screen.screen,
  persistence: screen.persistence,
  scope: screen.scope,
  endpoints: [...screen.endpoints].sort(),
  flows: [...screen.flows].sort(),
}));

const screensWithBackend = screens.filter((screen) => screen.scope !== 'client_only_intencional');
const screensClientOnly = screens.filter((screen) => screen.scope === 'client_only_intencional');
const screensValidated = screens.filter((screen) => screen.scope === 'critico_validado');
const screensPendingEvidence = screens.filter((screen) => screen.scope === 'backend_esperado_sem_evidencia_automatizada');

const placeholderHits = [];
for (const file of ['views/pro/ProDashboard.tsx', 'views/pro/ProMarketplace.tsx', 'views/pro/ProFinance.tsx', 'views/pro/financial/WalletViewScreen.tsx', 'views/space/SpaceFinance.tsx']) {
  const abs = path.join(repoRoot, file);
  const source = read(abs);
  if (/Em Implementação|Funcionalidade em Implementação|em breve/.test(source)) {
    placeholderHits.push(file);
  }
}

const report = {
  generatedAt: new Date().toISOString(),
  endpointCount: endpointInventory.length,
  frontendContractCount: uniqueFrontendContracts.length,
  screenCount: screens.length,
  screensWithBackendCount: screensWithBackend.length,
  screensClientOnlyCount: screensClientOnly.length,
  validatedScreensCount: screensValidated.length,
  pendingEvidenceScreensCount: screensPendingEvidence.length,
  placeholderHits,
  endpoints: endpointInventory,
  frontendContracts: uniqueFrontendContracts,
  screens,
};

const md = [
  '# Backend Real Inventory',
  '',
  `Gerado em: ${report.generatedAt}`,
  '',
  '## Resumo',
  '',
  `- Endpoints mapeados: ${report.endpointCount}`,
  `- Contratos frontend -> backend mapeados: ${report.frontendContractCount}`,
  `- Telas únicas mapeadas: ${report.screenCount}`,
  `- Telas com backend envolvido: ${report.screensWithBackendCount}`,
  `- Telas client-only intencionais: ${report.screensClientOnlyCount}`,
  `- Telas com evidência crítica validada: ${report.validatedScreensCount}`,
  `- Telas com backend esperado sem evidência automatizada: ${report.pendingEvidenceScreensCount}`,
  `- Placeholder residual nos hotspots auditados: ${report.placeholderHits.length}`,
  '',
  '## Endpoints',
  '',
  '| Método | Path | Arquivo |',
  '|---|---|---|',
  ...endpointInventory.map((item) => `| ${item.method} | \`${item.path}\` | \`${item.file}\` |`),
  '',
  '## Telas Com Backend',
  '',
  '| Perfil | Tela | Persistência | Escopo | Endpoints |',
  '|---|---|---|---|---|',
  ...screensWithBackend.map((item) => `| ${item.profile} | ${item.screen} | ${item.persistence} | ${item.scope} | ${item.endpoints.map((value) => `\`${value}\``).join(', ')} |`),
  '',
  '## Contratos Frontend',
  '',
  '| Path | Arquivo |',
  '|---|---|',
  ...uniqueFrontendContracts.map((item) => `| \`${item.path}\` | \`${item.file}\` |`),
  '',
].join('\n');

fs.writeFileSync(outJson, JSON.stringify(report, null, 2));
fs.writeFileSync(outMd, md);

console.log(`inventory: ${outJson}`);
console.log(`inventory: ${outMd}`);
