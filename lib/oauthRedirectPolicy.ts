export type OAuthRedirectPolicyInput = {
  configuredRedirect?: string;
  currentOrigin?: string;
  allowedOrigins?: string[];
  allowedOriginPatterns?: string[];
  defaultPath?: string;
  enforceSameOrigin?: boolean;
  productionRuntime?: boolean;
  preferRuntimeOriginWhenAllowed?: boolean;
};

export type OAuthRedirectPolicyResult = {
  redirectUrl: string;
  issues: string[];
  usedFallback: boolean;
};

const safeParseUrl = (value?: string): URL | null => {
  if (!value) return null;
  try {
    return new URL(value);
  } catch {
    return null;
  }
};

const normalizeOrigin = (value: string): string | null => {
  const parsed = safeParseUrl(value);
  return parsed ? parsed.origin : null;
};

const normalizeOriginPattern = (value: string): string | null => {
  const raw = String(value || '').trim();
  if (!raw) return null;
  if (!/^https?:\/\/\*\.[^/]+$/i.test(raw)) {
    return normalizeOrigin(raw);
  }
  return raw.replace(/\/+$/, '');
};

export const parseAllowedOrigins = (value?: string): string[] => {
  if (!value) return [];
  const items = value
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);

  const unique: string[] = [];
  for (const item of items) {
    const normalized = normalizeOrigin(item);
    if (!normalized) continue;
    if (!unique.includes(normalized)) unique.push(normalized);
  }
  return unique;
};

export const parseAllowedOriginPatterns = (value?: string): string[] => {
  if (!value) return [];
  const items = value
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);
  const unique: string[] = [];
  for (const item of items) {
    const normalized = normalizeOriginPattern(item);
    if (!normalized) continue;
    if (!unique.includes(normalized)) unique.push(normalized);
  }
  return unique;
};

const isOriginMatchedByPattern = (origin: string, pattern: string): boolean => {
  if (!pattern.includes('*')) return origin === pattern;
  const parsedOrigin = safeParseUrl(origin);
  if (!parsedOrigin) return false;
  const m = pattern.match(/^(https?):\/\/\*\.(.+)$/i);
  if (!m) return false;
  const [, proto, hostSuffix] = m;
  if (parsedOrigin.protocol.replace(':', '').toLowerCase() !== proto.toLowerCase()) return false;
  const host = parsedOrigin.hostname.toLowerCase();
  const suffix = hostSuffix.toLowerCase();
  return host.endsWith(`.${suffix}`) && host !== suffix;
};

const isOriginAllowlisted = (origin: string, exactOrigins: string[], patterns: string[]): boolean => {
  if (exactOrigins.includes(origin)) return true;
  return patterns.some((pattern) => isOriginMatchedByPattern(origin, pattern));
};

export const resolveOAuthRedirectPolicy = (input: OAuthRedirectPolicyInput): OAuthRedirectPolicyResult => {
  const issues: string[] = [];
  const defaultPath = input.defaultPath || '/login';
  const runtimeOrigin = normalizeOrigin(input.currentOrigin || '') || 'http://localhost:5173';
  const exactAllowedOrigins = Array.from(new Set([
    ...(input.allowedOrigins || []),
    'http://localhost:5173',
    'http://127.0.0.1:5173',
  ]));
  const allowedPatterns = Array.from(new Set(input.allowedOriginPatterns || []));
  const runtimeIsAllowlisted = isOriginAllowlisted(runtimeOrigin, exactAllowedOrigins, allowedPatterns);
  const configuredUrl = safeParseUrl(input.configuredRedirect);
  const runtimeUrl = safeParseUrl(`${runtimeOrigin}${defaultPath}`);
  const preferRuntime = !!input.preferRuntimeOriginWhenAllowed && runtimeIsAllowlisted;
  const candidate = preferRuntime ? (runtimeUrl || configuredUrl) : (configuredUrl || runtimeUrl);

  if (!candidate) {
    issues.push('Unable to resolve OAuth redirect URL.');
    return {
      redirectUrl: `${runtimeOrigin}${defaultPath}`,
      issues,
      usedFallback: true,
    };
  }

  const candidateOrigin = candidate.origin;
  if (!isOriginAllowlisted(candidateOrigin, exactAllowedOrigins, allowedPatterns)) {
    issues.push(`OAuth redirect origin is not allowlisted: ${candidateOrigin}`);
  }

  if (input.enforceSameOrigin && candidateOrigin !== runtimeOrigin) {
    issues.push(`OAuth redirect origin must match app origin (${runtimeOrigin}).`);
  }

  if (candidate.pathname !== defaultPath) {
    issues.push(`OAuth redirect path must be exactly ${defaultPath}.`);
  }

  if (candidate.search) {
    issues.push('OAuth redirect URL must not include query params.');
  }

  if (candidate.hash) {
    issues.push('OAuth redirect URL must not include hash fragment.');
  }

  if (input.productionRuntime && candidate.protocol !== 'https:') {
    issues.push('OAuth redirect URL must use HTTPS in production runtime.');
  }

  if (issues.length > 0) {
    return {
      redirectUrl: `${runtimeOrigin}${defaultPath}`,
      issues,
      usedFallback: true,
    };
  }

  return {
    redirectUrl: candidate.toString(),
    issues,
    usedFallback: false,
  };
};
