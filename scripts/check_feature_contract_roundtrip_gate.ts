import fs from 'fs';
import path from 'path';

type CatalogItem = {
  id: string;
  contractType: 'CLIENT_ONLY' | 'PERSISTIDO_VALIDADO' | 'MISTO_OU_PARCIAL' | 'NAO_CLASSIFICADO' | string;
  validationEvidence?: { evidence?: string[] } | null;
};

type FeatureContractCatalog = {
  totals?: {
    flows?: number;
    mixedOrPartial?: number;
  };
  catalog?: CatalogItem[];
};

type RoundTripAllowlistItem = {
  flowId: string;
  until?: string;
  owner?: string;
  reason?: string;
};

type RoundTripAllowlist = {
  defaultUntil?: string;
  items?: RoundTripAllowlistItem[];
};

const catalogPath = path.resolve(process.cwd(), 'reports/feature_contract_catalog.json');
const allowlistPath = path.resolve(process.cwd(), 'qa/config/feature_contract_roundtrip_allowlist.json');
const reportsDir = path.resolve(process.cwd(), 'reports');
const outPath = path.resolve(reportsDir, 'feature_contract_roundtrip_gate.json');

const parseDate = (value?: string) => {
  if (!value) return null;
  const normalized = /^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T23:59:59.999Z` : value;
  const ts = Date.parse(normalized);
  return Number.isFinite(ts) ? ts : null;
};

if (!fs.existsSync(catalogPath)) {
  console.error(`feature-contract-roundtrip-gate: arquivo ausente (${catalogPath}). Rode 'npm run qa:feature-contract-catalog' antes.`);
  process.exit(1);
}

const payload = JSON.parse(fs.readFileSync(catalogPath, 'utf8')) as FeatureContractCatalog;
const catalog = Array.isArray(payload.catalog) ? payload.catalog : [];

let allowlist: RoundTripAllowlist = { items: [] };
if (fs.existsSync(allowlistPath)) {
  allowlist = JSON.parse(fs.readFileSync(allowlistPath, 'utf8')) as RoundTripAllowlist;
}

const defaultAllowUntil = parseDate(allowlist.defaultUntil);
const allowlistByFlow = new Map<string, RoundTripAllowlistItem>();
for (const item of allowlist.items || []) {
  if (!item?.flowId) continue;
  allowlistByFlow.set(item.flowId, item);
}

const now = Date.now();
const mixedWithoutEvidence = catalog.filter((item) =>
  item.contractType === 'MISTO_OU_PARCIAL'
  && !item.validationEvidence,
);

const exempted: Array<{ flowId: string; until: string | null; owner: string | null; reason: string | null }> = [];
const expired: string[] = [];
const missing: string[] = [];

for (const item of mixedWithoutEvidence) {
  const allow = allowlistByFlow.get(item.id);
  if (!allow) {
    missing.push(item.id);
    continue;
  }
  const untilTs = parseDate(allow.until) ?? defaultAllowUntil;
  const untilLabel = allow.until || allowlist.defaultUntil || null;
  if (untilTs == null) {
    missing.push(item.id);
    continue;
  }
  if (untilTs < now) {
    expired.push(item.id);
    continue;
  }
  exempted.push({
    flowId: item.id,
    until: untilLabel,
    owner: allow.owner || null,
    reason: allow.reason || null,
  });
}

const staleAllowlistEntries = (allowlist.items || [])
  .map((item) => item.flowId)
  .filter((flowId): flowId is string => !!flowId)
  .filter((flowId) => !mixedWithoutEvidence.some((item) => item.id === flowId));

const summary = {
  generatedAt: new Date().toISOString(),
  source: {
    catalog: 'reports/feature_contract_catalog.json',
    allowlist: fs.existsSync(allowlistPath) ? 'qa/config/feature_contract_roundtrip_allowlist.json' : null,
  },
  totals: {
    flows: Number(payload.totals?.flows || catalog.length || 0),
    mixedOrPartial: Number(payload.totals?.mixedOrPartial || 0),
    mixedWithoutEvidence: mixedWithoutEvidence.length,
    exemptedByAllowlist: exempted.length,
    missingEvidenceAndNoAllowlist: missing.length,
    expiredAllowlist: expired.length,
    staleAllowlistEntries: staleAllowlistEntries.length,
  },
  missing,
  expired,
  exempted,
  staleAllowlistEntries,
};

if (!fs.existsSync(reportsDir)) fs.mkdirSync(reportsDir, { recursive: true });
fs.writeFileSync(outPath, JSON.stringify(summary, null, 2), 'utf8');

console.log(
  `feature-contract-roundtrip-gate: mixedWithoutEvidence=${summary.totals.mixedWithoutEvidence} exempted=${summary.totals.exemptedByAllowlist} missing=${summary.totals.missingEvidenceAndNoAllowlist} expired=${summary.totals.expiredAllowlist}`,
);

if (staleAllowlistEntries.length > 0) {
  console.log(`feature-contract-roundtrip-gate: stale allowlist entries -> ${staleAllowlistEntries.join(', ')}`);
}

if (expired.length > 0) {
  console.error(`feature-contract-roundtrip-gate: FAIL (allowlist expirou para ${expired.join(', ')})`);
  process.exit(1);
}

if (missing.length > 0) {
  console.error(`feature-contract-roundtrip-gate: FAIL (flows MISTO_OU_PARCIAL sem evidência explícita e sem allowlist: ${missing.join(', ')})`);
  process.exit(1);
}

console.log('feature-contract-roundtrip-gate: PASS');
