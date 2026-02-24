#!/usr/bin/env node
const fs = require('fs');

const [summaryPath, minLines, minStatements, minFunctions, minBranches, layerName] = process.argv.slice(2);

if (!summaryPath) {
  console.error('Usage: node scripts/check_layer_coverage.cjs <summaryPath> <lines> <statements> <functions> <branches> [layerName]');
  process.exit(2);
}

const raw = fs.readFileSync(summaryPath, 'utf8');
const summary = JSON.parse(raw);
const total = summary.total || {};

const thresholds = {
  lines: Number(minLines ?? 0),
  statements: Number(minStatements ?? 0),
  functions: Number(minFunctions ?? 0),
  branches: Number(minBranches ?? 0),
};

const metrics = {
  lines: Number(total.lines?.pct ?? 0),
  statements: Number(total.statements?.pct ?? 0),
  functions: Number(total.functions?.pct ?? 0),
  branches: Number(total.branches?.pct ?? 0),
};

const label = layerName || summaryPath;
const failures = Object.entries(thresholds)
  .filter(([key, min]) => metrics[key] < min)
  .map(([key, min]) => `${key}: ${metrics[key]} < ${min}`);

if (failures.length > 0) {
  console.error(`[coverage:${label}] threshold failed`);
  failures.forEach((failure) => console.error(`  - ${failure}`));
  process.exit(1);
}

console.log(`[coverage:${label}] ok`);
console.log(`  lines=${metrics.lines} statements=${metrics.statements} functions=${metrics.functions} branches=${metrics.branches}`);

