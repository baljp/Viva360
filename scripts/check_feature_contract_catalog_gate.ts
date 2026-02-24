import fs from 'fs';
import path from 'path';

type FeatureContractCatalog = {
  totals?: {
    flows?: number;
    unclassified?: number;
    clientOnly?: number;
    persistedValidated?: number;
    mixedOrPartial?: number;
  };
};

const filePath = path.resolve(process.cwd(), 'reports/feature_contract_catalog.json');

if (!fs.existsSync(filePath)) {
  console.error(`feature-contract-gate: arquivo ausente (${filePath}). Rode 'npm run qa:feature-contract-catalog' antes.`);
  process.exit(1);
}

const payload = JSON.parse(fs.readFileSync(filePath, 'utf8')) as FeatureContractCatalog;
const totals = payload.totals || {};
const unclassified = Number(totals.unclassified || 0);

console.log(`feature-contract-gate: flows=${Number(totals.flows || 0)} unclassified=${unclassified}`);

if (unclassified > 0) {
  console.error('feature-contract-gate: FAIL (unclassified > 0)');
  process.exit(1);
}

console.log('feature-contract-gate: PASS');
