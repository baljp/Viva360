export type OAuthRedirectPolicyInput = {
  configuredRedirect?: string;
  currentOrigin?: string;
  allowedOrigins?: string[];
  defaultPath?: string;
  enforceSameOrigin?: boolean;
  productionRuntime?: boolean;
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

export const resolveOAuthRedirectPolicy = (input: OAuthRedirectPolicyInput): OAuthRedirectPolicyResult => {
  const issues: string[] = [];
  const defaultPath = input.defaultPath || '/login';
  const runtimeOrigin = normalizeOrigin(input.currentOrigin || '') || 'http://localhost:5173';

  const baseAllowed = new Set<string>(input.allowedOrigins || []);
  baseAllowed.add(runtimeOrigin);
  baseAllowed.add('http://localhost:5173');
  baseAllowed.add('http://127.0.0.1:5173');

  const configuredUrl = safeParseUrl(input.configuredRedirect);
  const candidate = configuredUrl || safeParseUrl(`${runtimeOrigin}${defaultPath}`);

  if (!candidate) {
    issues.push('Unable to resolve OAuth redirect URL.');
    return {
      redirectUrl: `${runtimeOrigin}${defaultPath}`,
      issues,
      usedFallback: true,
    };
  }

  const candidateOrigin = candidate.origin;
  const allowedOrigins = Array.from(baseAllowed);

  if (!allowedOrigins.includes(candidateOrigin)) {
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
