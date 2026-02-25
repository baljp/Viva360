import crypto from 'crypto';

type AuthConfigIssueLevel = 'warning' | 'error';

type AuthConfigIssue = {
  code: string;
  level: AuthConfigIssueLevel;
  message: string;
};

const safeOrigin = (value?: string | null): string | null => {
  try {
    const raw = String(value || '').trim();
    if (!raw) return null;
    return new URL(raw).origin;
  } catch {
    return null;
  }
};

const safeHost = (value?: string | null): string | null => {
  try {
    const raw = String(value || '').trim();
    if (!raw) return null;
    return new URL(raw).host;
  } catch {
    return null;
  }
};

const splitCsv = (value?: string | null): string[] =>
  String(value || '')
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean);

const normalizeOriginList = (values: string[]) =>
  Array.from(
    new Set(
      values
        .map((v) => safeOrigin(v))
        .filter((v): v is string => !!v),
    ),
  );

const normalizePatternList = (values: string[]) =>
  Array.from(
    new Set(
      values
        .map((v) => String(v || '').trim())
        .filter(Boolean),
    ),
  );

export const getAuthConfigHealthSnapshot = () => {
  const vercelEnv = String(process.env.VERCEL_ENV || '').trim() || 'unknown';
  const vercelUrl = String(process.env.VERCEL_URL || '').trim();
  const runtimeOrigin = safeOrigin(vercelUrl ? `https://${vercelUrl.replace(/^https?:\/\//, '')}` : (process.env.FRONTEND_URL || ''));
  const frontendOrigin = safeOrigin(process.env.FRONTEND_URL || process.env.VITE_PUBLIC_APP_URL || '');
  const oauthRedirect = String(process.env.VITE_SUPABASE_AUTH_REDIRECT_URL || '').trim();
  const oauthRedirectOrigin = safeOrigin(oauthRedirect);
  const oauthRedirectPath = (() => {
    try { return oauthRedirect ? new URL(oauthRedirect).pathname : null; } catch { return null; }
  })();
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
  const supabaseHost = safeHost(supabaseUrl);
  const allowedOrigins = normalizeOriginList(splitCsv(process.env.VITE_OAUTH_ALLOWED_ORIGINS));
  const allowedOriginPatterns = normalizePatternList(splitCsv(process.env.VITE_OAUTH_ALLOWED_ORIGIN_PATTERNS));
  const authConfigVersion = String(process.env.AUTH_CONFIG_VERSION || process.env.VITE_AUTH_CONFIG_VERSION || '').trim() || null;

  const issues: AuthConfigIssue[] = [];
  const pushIssue = (code: string, level: AuthConfigIssueLevel, message: string) => issues.push({ code, level, message });

  if (!supabaseHost) pushIssue('SUPABASE_URL_MISSING', 'error', 'SUPABASE_URL/VITE_SUPABASE_URL ausente ou inválida.');
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) pushIssue('SUPABASE_SERVICE_ROLE_KEY_MISSING', 'error', 'SUPABASE_SERVICE_ROLE_KEY ausente.');
  if (!process.env.SUPABASE_ANON_KEY && !process.env.VITE_SUPABASE_ANON_KEY) {
    pushIssue('SUPABASE_ANON_KEY_MISSING', 'error', 'SUPABASE_ANON_KEY/VITE_SUPABASE_ANON_KEY ausente.');
  }
  if (!oauthRedirectOrigin) pushIssue('OAUTH_REDIRECT_MISSING', 'error', 'VITE_SUPABASE_AUTH_REDIRECT_URL ausente ou inválida.');
  if (!frontendOrigin) pushIssue('FRONTEND_URL_MISSING', 'warning', 'FRONTEND_URL/VITE_PUBLIC_APP_URL ausente ou inválida.');
  if (!authConfigVersion) pushIssue('AUTH_CONFIG_VERSION_MISSING', 'warning', 'AUTH_CONFIG_VERSION/VITE_AUTH_CONFIG_VERSION ausente.');
  if (oauthRedirectOrigin && frontendOrigin && oauthRedirectOrigin !== frontendOrigin) {
    pushIssue(
      'FRONTEND_REDIRECT_ORIGIN_MISMATCH',
      'warning',
      `Origem do app (${frontendOrigin}) difere da origem do redirect OAuth (${oauthRedirectOrigin}).`,
    );
  }
  if (oauthRedirectPath && oauthRedirectPath !== '/login') {
    pushIssue('OAUTH_REDIRECT_PATH_UNEXPECTED', 'warning', `Redirect OAuth usa path ${oauthRedirectPath}; esperado /login.`);
  }
  if (allowedOrigins.length === 0 && allowedOriginPatterns.length === 0) {
    pushIssue('OAUTH_ALLOWLIST_EMPTY', 'warning', 'Nenhuma allowlist/pattern OAuth configurada (VITE_OAUTH_ALLOWED_ORIGINS/PATTERNS).');
  }

  const fingerprintSource = JSON.stringify({
    vercelEnv,
    runtimeOrigin,
    frontendOrigin,
    oauthRedirectOrigin,
    oauthRedirectPath,
    supabaseHost,
    allowedOrigins,
    allowedOriginPatterns,
    authConfigVersion,
    hasAnon: !!(process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY),
    hasServiceRole: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
  });
  const fingerprint = crypto.createHash('sha256').update(fingerprintSource).digest('hex').slice(0, 16);

  const errorCount = issues.filter((i) => i.level === 'error').length;
  const warningCount = issues.filter((i) => i.level === 'warning').length;

  return {
    ok: errorCount === 0,
    status: errorCount > 0 ? 'degraded' : 'ok',
    fingerprint,
    runtime: {
      vercelEnv,
      vercelUrl: vercelUrl || null,
      runtimeOrigin,
    },
    authConfig: {
      authConfigVersion,
      frontendOrigin,
      oauthRedirectOrigin,
      oauthRedirectPath,
      supabaseHost,
      oauthAllowlist: {
        exactOrigins: allowedOrigins,
        originPatterns: allowedOriginPatterns,
      },
    },
    presence: {
      hasSupabaseUrl: !!supabaseHost,
      hasSupabaseAnonKey: !!(process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY),
      hasSupabaseServiceRoleKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      hasOAuthRedirect: !!oauthRedirectOrigin,
      hasFrontendUrl: !!frontendOrigin,
      hasAuthConfigVersion: !!authConfigVersion,
    },
    issues,
    summary: {
      errors: errorCount,
      warnings: warningCount,
    },
    timestamp: new Date().toISOString(),
  } as const;
};

