import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

type Finding = {
  level: 'ERROR';
  file: string;
  line: number;
  reason: string;
  snippet: string;
};

const strictMode = process.argv.includes('--strict');
const findings: Finding[] = [];

const blockedTrackedFiles = new Set([
  '.env',
  '.env.production',
  '.env.staging',
  'backend/.env',
  'backend/.env.production',
]);

const placeholderPattern = /(your-|change-me|<REDACTED>|<|example|test|dummy|localhost|127\.0\.0\.1|password|\[PASSWORD\]|\[PROJECT_ID\]|\[REGION\]|\$\{\{\s*secrets\.|resolvedJwtSecret)/i;

const pushFinding = (finding: Finding) => findings.push(finding);

const getTrackedFiles = () => {
  try {
    const output = execSync('git ls-files', { encoding: 'utf8' });
    return output.split('\n').map((line) => line.trim()).filter(Boolean);
  } catch {
    return [];
  }
};

const parseDbHost = (value: string) => {
  const match = value.match(/postgres(?:ql)?:\/\/[^:\s@]+:[^@\s]+@([^/\s]+)/i);
  if (!match) return '';
  return String(match[1] || '').split(':')[0].toLowerCase();
};

const scanFile = (filePath: string) => {
  if (!fs.existsSync(filePath)) return;
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');

  lines.forEach((line, index) => {
    const lineNo = index + 1;
    const snippet = line.trim().slice(0, 240);

    if (/ghp_[A-Za-z0-9]{20,}/.test(line)) {
      pushFinding({
        level: 'ERROR',
        file: filePath,
        line: lineNo,
        reason: 'GitHub personal access token detected in tracked file.',
        snippet,
      });
    }

    if (/\b(SUPABASE_SERVICE_ROLE_KEY|VITE_SUPABASE_ANON_KEY)\s*[:=]\s*['"]?eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/.test(line) && !placeholderPattern.test(line)) {
      pushFinding({
        level: 'ERROR',
        file: filePath,
        line: lineNo,
        reason: 'Live Supabase key detected in tracked file.',
        snippet,
      });
    }

    const jwtLine = line.match(/\bJWT_SECRET\s*[:=]\s*['"]?([^'"`\s]+)/);
    if (jwtLine) {
      const jwtValue = String(jwtLine[1] || '');
      const looksHardcodedSecret = /^[A-Za-z0-9+/=._-]{16,}$/.test(jwtValue) && /[0-9]/.test(jwtValue);
      if (looksHardcodedSecret && !placeholderPattern.test(jwtValue)) {
        pushFinding({
          level: 'ERROR',
          file: filePath,
          line: lineNo,
          reason: 'JWT secret value appears to be hardcoded in tracked file.',
          snippet,
        });
      }
    }

    const dbLine = line.match(/(DATABASE_URL|DIRECT_URL)\s*[:=]\s*['"]?([^'"`\s]+)/);
    if (dbLine) {
      const urlValue = String(dbLine[2] || '');
      const host = parseDbHost(urlValue);
      const hasInlinePassword = /postgres(?:ql)?:\/\/[^:\s@]+:([^@\s]+)@/i.test(urlValue);
      const isLocalHost = host === 'localhost' || host === '127.0.0.1' || host === 'db';
      if (hasInlinePassword && !isLocalHost && !placeholderPattern.test(urlValue)) {
        pushFinding({
          level: 'ERROR',
          file: filePath,
          line: lineNo,
          reason: 'Database connection string with inline credential detected in tracked file.',
          snippet,
        });
      }
    }
  });
};

const trackedFiles = getTrackedFiles();
for (const trackedFile of trackedFiles) {
  if (blockedTrackedFiles.has(trackedFile)) {
    pushFinding({
      level: 'ERROR',
      file: trackedFile,
      line: 1,
      reason: 'Blocked env file is tracked by git.',
      snippet: trackedFile,
    });
    continue;
  }

  scanFile(trackedFile);
}

const reportsDir = path.resolve(process.cwd(), 'reports');
if (!fs.existsSync(reportsDir)) fs.mkdirSync(reportsDir, { recursive: true });

const payload = {
  generatedAt: new Date().toISOString(),
  strictMode,
  findings,
  ok: findings.length === 0,
};

const outJson = path.join(reportsDir, 'tracked_secret_audit.json');
const outMd = path.join(reportsDir, 'tracked_secret_audit.md');

fs.writeFileSync(outJson, JSON.stringify(payload, null, 2), 'utf8');

const mdLines = [
  '# Tracked Secret Audit',
  '',
  `Generated at: ${payload.generatedAt}`,
  `Status: ${payload.ok ? 'PASS' : 'FAIL'}`,
  '',
  '| Level | File | Line | Reason |',
  '|---|---|---:|---|',
  ...findings.map((finding) => `| ${finding.level} | ${finding.file} | ${finding.line} | ${finding.reason} |`),
];
fs.writeFileSync(outMd, `${mdLines.join('\n')}\n`, 'utf8');

if (payload.ok) {
  console.log('tracked-secret-audit: PASS');
  console.log(`tracked-secret-audit: ${outJson}`);
  console.log(`tracked-secret-audit: ${outMd}`);
  process.exit(0);
}

console.log(`tracked-secret-audit: FAIL (${findings.length} findings)`);
for (const finding of findings) {
  console.log(`- [${finding.level}] ${finding.file}:${finding.line} ${finding.reason}`);
}
console.log(`tracked-secret-audit: ${outJson}`);
console.log(`tracked-secret-audit: ${outMd}`);

if (strictMode) process.exit(1);
process.exit(0);
