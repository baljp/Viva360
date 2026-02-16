import fs from 'fs';
import path from 'path';

type Finding = {
  level: 'ERROR' | 'WARN';
  file: string;
  line: number;
  reason: string;
  snippet: string;
};

const strictMode = process.argv.includes('--strict');
const backendRoot = path.resolve(process.cwd(), 'backend', 'src');
const frontendRoots = [
  path.resolve(process.cwd(), 'src'),
  path.resolve(process.cwd(), 'services'),
  path.resolve(process.cwd(), 'lib'),
];
const findings: Finding[] = [];

const suspiciousRoute = (value: string) => {
  const normalized = value.trim();
  return (
    /^\/api\/(debug|test|mock)(?:\/|$|-)/i.test(normalized)
    || /^\/(debug|test|mock)(?:\/|$|-)/i.test(normalized)
  );
};

const pushFinding = (finding: Finding) => {
  findings.push(finding);
};

const scanRouteRegistrations = (filePath: string, content: string) => {
  const routeRegex = /\b(?:app|router)\.(?:get|post|put|patch|delete|use)\s*\(\s*['"`]([^'"`]+)['"`]/g;
  const hasDebugGate = content.includes('if (isDebugRoutesEnabled)');
  let match: RegExpExecArray | null;

  while ((match = routeRegex.exec(content)) !== null) {
    const routePath = String(match[1] || '').trim();
    if (!suspiciousRoute(routePath)) continue;

    const index = match.index;
    const line = content.slice(0, index).split('\n').length;
    const lineText = content.split('\n')[line - 1] || '';
    const isAllowedDebugInApp = filePath.endsWith(path.join('backend', 'src', 'app.ts'))
      && /^\/api\/debug(?:\/|$|-)/i.test(routePath)
      && hasDebugGate;

    if (!isAllowedDebugInApp) {
      pushFinding({
        level: 'ERROR',
        file: path.relative(process.cwd(), filePath),
        line,
        reason: `Suspicious route exposed without explicit guard: ${routePath}`,
        snippet: lineText.trim().slice(0, 220),
      });
    }
  }
};

const scanFrontendLiterals = (filePath: string, content: string) => {
  const routeLiteralRegex = /['"`](\/(?:api\/)?(?:debug|test|mock)(?:\/|$|-)[^'"`]*)['"`]/gi;
  let match: RegExpExecArray | null;
  while ((match = routeLiteralRegex.exec(content)) !== null) {
    const routePath = String(match[1] || '').trim();
    if (!suspiciousRoute(routePath)) continue;
    const line = content.slice(0, match.index).split('\n').length;
    const lineText = content.split('\n')[line - 1] || '';
    pushFinding({
      level: 'ERROR',
      file: path.relative(process.cwd(), filePath),
      line,
      reason: `Suspicious client route literal found: ${routePath}`,
      snippet: lineText.trim().slice(0, 220),
    });
  }
};

const walk = (dir: string, onFile: (filePath: string, content: string) => void) => {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === 'dist' || entry.name === 'tests' || entry.name === 'qa') continue;
      walk(fullPath, onFile);
      continue;
    }

    if (!entry.name.endsWith('.ts') && !entry.name.endsWith('.tsx') && !entry.name.endsWith('.js') && !entry.name.endsWith('.jsx')) continue;
    const content = fs.readFileSync(fullPath, 'utf8');
    onFile(fullPath, content);
  }
};

const auditRuntimeGuardAndEnv = () => {
  const appPath = path.resolve(process.cwd(), 'backend', 'src', 'app.ts');
  if (fs.existsSync(appPath)) {
    const appSource = fs.readFileSync(appPath, 'utf8');
    // Allow both `assertCriticalProdConfig();` and assignments like
    // `const issues = assertCriticalProdConfig();`.
    if (!/assertCriticalProdConfig\s*\(/.test(appSource)) {
      pushFinding({
        level: 'ERROR',
        file: path.relative(process.cwd(), appPath),
        line: 1,
        reason: 'Missing assertCriticalProdConfig() call in app bootstrap.',
        snippet: 'assertCriticalProdConfig(...) not found',
      });
    }
  }

  const envProdPath = path.resolve(process.cwd(), '.env.production');
  if (!fs.existsSync(envProdPath)) return;
  const envContent = fs.readFileSync(envProdPath, 'utf8');
  const lines = envContent.split('\n');

  const getValue = (key: string): string => {
    const row = lines.find((line) => line.startsWith(`${key}=`));
    return String(row?.slice(key.length + 1) || '').trim();
  };

  const appMode = getValue('APP_MODE').toUpperCase();
  if (appMode === 'MOCK' || appMode === 'DEMO') {
    pushFinding({
      level: 'ERROR',
      file: '.env.production',
      line: lines.findIndex((line) => line.startsWith('APP_MODE=')) + 1,
      reason: `APP_MODE must not be ${appMode} in production env file.`,
      snippet: `APP_MODE=${appMode}`,
    });
  }
  const viteAppMode = getValue('VITE_APP_MODE').toUpperCase();
  if (viteAppMode === 'MOCK' || viteAppMode === 'DEMO') {
    pushFinding({
      level: 'ERROR',
      file: '.env.production',
      line: lines.findIndex((line) => line.startsWith('VITE_APP_MODE=')) + 1,
      reason: `VITE_APP_MODE must not be ${viteAppMode} in production env file.`,
      snippet: `VITE_APP_MODE=${viteAppMode}`,
    });
  }

  const testFlagKeys = ['ENABLE_TEST_MODE', 'VITE_ENABLE_TEST_MODE', 'ENABLE_DEBUG_ROUTES'];
  for (const key of testFlagKeys) {
    const value = getValue(key).toLowerCase();
    if (value === 'true' || value === '1') {
      pushFinding({
        level: 'ERROR',
        file: '.env.production',
        line: lines.findIndex((line) => line.startsWith(`${key}=`)) + 1,
        reason: `${key} must be disabled in production env file.`,
        snippet: `${key}=${value}`,
      });
    }
  }
};

walk(backendRoot, scanRouteRegistrations);
for (const root of frontendRoots) {
  walk(root, scanFrontendLiterals);
}
auditRuntimeGuardAndEnv();

const reportsDir = path.resolve(process.cwd(), 'reports');
if (!fs.existsSync(reportsDir)) fs.mkdirSync(reportsDir, { recursive: true });

const ok = findings.length === 0;
// Keep reports deterministic on PASS so the repo doesn't churn due to timestamps.
const payload: Record<string, unknown> = {
  strictMode,
  findings,
  ok,
};
if (!ok) {
  payload.generatedAt = new Date().toISOString();
}

const jsonPath = path.join(reportsDir, 'test_route_leak_audit.json');
const mdPath = path.join(reportsDir, 'test_route_leak_audit.md');
fs.writeFileSync(jsonPath, JSON.stringify(payload, null, 2), 'utf8');

const lines = [
  '# Test/Debug Route Leak Audit',
  '',
  ...(ok ? [] : [`Generated at: ${String(payload.generatedAt)}`]),
  `Status: ${ok ? 'PASS' : 'FAIL'}`,
  '',
  '| Level | File | Line | Reason |',
  '|---|---|---:|---|',
  ...findings.map((finding) => `| ${finding.level} | ${finding.file} | ${finding.line} | ${finding.reason} |`),
];
fs.writeFileSync(mdPath, `${lines.join('\n')}\n`, 'utf8');

if (ok) {
  console.log('route-leak-audit: PASS');
  console.log(`route-leak-audit: ${jsonPath}`);
  console.log(`route-leak-audit: ${mdPath}`);
  process.exit(0);
}

console.log(`route-leak-audit: FAIL (${findings.length} findings)`);
for (const finding of findings) {
  console.log(`- [${finding.level}] ${finding.file}:${finding.line} ${finding.reason}`);
}
console.log(`route-leak-audit: ${jsonPath}`);
console.log(`route-leak-audit: ${mdPath}`);

if (strictMode) {
  process.exit(1);
}

process.exit(0);
