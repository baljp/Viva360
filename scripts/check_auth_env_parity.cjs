#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const REQUIRED_AUTH_KEYS = [
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'VITE_SUPABASE_AUTH_REDIRECT_URL',
  'FRONTEND_URL',
];

const OPTIONAL_RECOMMENDED_KEYS = [
  'VITE_OAUTH_ALLOWED_ORIGINS',
  'VITE_OAUTH_ALLOWED_ORIGIN_PATTERNS',
  'VITE_PUBLIC_APP_URL',
  'AUTH_CONFIG_VERSION',
  'VITE_AUTH_CONFIG_VERSION',
];

const parseEnvFile = (filePath) => {
  const abs = path.resolve(process.cwd(), filePath);
  const raw = fs.readFileSync(abs, 'utf8');
  const env = {};
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf('=');
    if (idx <= 0) continue;
    const key = trimmed.slice(0, idx).trim();
    let value = trimmed.slice(idx + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    env[key] = value;
  }
  return env;
};

const safeOrigin = (value) => {
  try {
    return value ? new URL(value).origin : null;
  } catch {
    return null;
  }
};

const [, , previewFile, prodFile] = process.argv;
if (!previewFile || !prodFile) {
  console.error('Uso: node scripts/check_auth_env_parity.cjs <preview.env> <prod.env>');
  process.exit(2);
}

const preview = parseEnvFile(previewFile);
const prod = parseEnvFile(prodFile);
const issues = [];
const warnings = [];

for (const key of REQUIRED_AUTH_KEYS) {
  if (!String(preview[key] || '').trim()) issues.push(`[preview] chave obrigatória ausente: ${key}`);
  if (!String(prod[key] || '').trim()) issues.push(`[prod] chave obrigatória ausente: ${key}`);
}

for (const key of OPTIONAL_RECOMMENDED_KEYS) {
  if (!String(preview[key] || '').trim()) warnings.push(`[preview] recomendada ausente: ${key}`);
  if (!String(prod[key] || '').trim()) warnings.push(`[prod] recomendada ausente: ${key}`);
}

const exactParityKeys = [
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'VITE_OAUTH_ALLOWED_ORIGINS',
  'VITE_OAUTH_ALLOWED_ORIGIN_PATTERNS',
  'AUTH_CONFIG_VERSION',
  'VITE_AUTH_CONFIG_VERSION',
];
for (const key of exactParityKeys) {
  const a = String(preview[key] || '').trim();
  const b = String(prod[key] || '').trim();
  if (a && b && a !== b) {
    issues.push(`divergência entre preview/prod em ${key}`);
  }
}

const previewRedirectOrigin = safeOrigin(preview.VITE_SUPABASE_AUTH_REDIRECT_URL);
const prodRedirectOrigin = safeOrigin(prod.VITE_SUPABASE_AUTH_REDIRECT_URL);
const previewFrontendOrigin = safeOrigin(preview.FRONTEND_URL);
const prodFrontendOrigin = safeOrigin(prod.FRONTEND_URL);

if (previewRedirectOrigin && previewFrontendOrigin && previewRedirectOrigin !== previewFrontendOrigin) {
  issues.push(`[preview] FRONTEND_URL e VITE_SUPABASE_AUTH_REDIRECT_URL divergem (${previewFrontendOrigin} vs ${previewRedirectOrigin})`);
}
if (prodRedirectOrigin && prodFrontendOrigin && prodRedirectOrigin !== prodFrontendOrigin) {
  issues.push(`[prod] FRONTEND_URL e VITE_SUPABASE_AUTH_REDIRECT_URL divergem (${prodFrontendOrigin} vs ${prodRedirectOrigin})`);
}

const out = {
  ok: issues.length === 0,
  previewFile,
  prodFile,
  issues,
  warnings,
};

if (issues.length > 0) {
  console.error(JSON.stringify(out, null, 2));
  process.exit(1);
}

console.log(JSON.stringify(out, null, 2));
