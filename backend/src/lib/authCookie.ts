import type { CookieOptions, Request, Response } from 'express';

const DEFAULT_AUTH_COOKIE_NAME = 'viva360.auth';
const DEFAULT_MAX_AGE_SECONDS = 7 * 24 * 60 * 60;

type SameSiteMode = 'lax' | 'strict' | 'none';

const normalizeSameSite = (value?: string): SameSiteMode => {
  const normalized = String(value || '').trim().toLowerCase();
  if (normalized === 'none') return 'none';
  if (normalized === 'strict') return 'strict';
  return 'lax';
};

export const AUTH_COOKIE_NAME = String(process.env.AUTH_COOKIE_NAME || DEFAULT_AUTH_COOKIE_NAME).trim();

export const parseCookieHeader = (cookieHeader?: string | null): Record<string, string> => {
  const out: Record<string, string> = {};
  const raw = String(cookieHeader || '').trim();
  if (!raw) return out;

  raw.split(';').forEach((part) => {
    const idx = part.indexOf('=');
    if (idx <= 0) return;
    const key = part.slice(0, idx).trim();
    const value = part.slice(idx + 1).trim();
    if (!key) return;
    try {
      out[key] = decodeURIComponent(value);
    } catch {
      out[key] = value;
    }
  });

  return out;
};

export const getAuthCookieToken = (req: Request): string | null => {
  const cookies = parseCookieHeader(req.headers.cookie);
  const token = String(cookies[AUTH_COOKIE_NAME] || '').trim();
  return token || null;
};

export const getBearerToken = (req: Request): string | null => {
  const authHeader = String(req.headers.authorization || '').trim();
  if (!authHeader) return null;
  const [scheme, token] = authHeader.split(/\s+/, 2);
  if (!/^bearer$/i.test(String(scheme || ''))) return null;
  const safeToken = String(token || '').trim();
  return safeToken || null;
};

export const readAuthTokenFromRequest = (
  req: Request,
): { token: string | null; source: 'bearer' | 'cookie' | null } => {
  const bearer = getBearerToken(req);
  if (bearer) return { token: bearer, source: 'bearer' };
  const cookie = getAuthCookieToken(req);
  if (cookie) return { token: cookie, source: 'cookie' };
  return { token: null, source: null };
};

const isSecureCookie = (req?: Request) => {
  if (process.env.AUTH_COOKIE_SECURE) {
    return String(process.env.AUTH_COOKIE_SECURE).trim().toLowerCase() === 'true';
  }
  if (process.env.NODE_ENV === 'production') return true;
  const proto = String(req?.headers['x-forwarded-proto'] || '').toLowerCase();
  return proto === 'https';
};

export const buildAuthCookieOptions = (req?: Request): CookieOptions => {
  const sameSite = normalizeSameSite(process.env.AUTH_COOKIE_SAMESITE);
  const secure = isSecureCookie(req) || sameSite === 'none';
  const maxAgeSeconds = Number(process.env.AUTH_COOKIE_MAX_AGE_SECONDS || DEFAULT_MAX_AGE_SECONDS);
  const domain = String(process.env.AUTH_COOKIE_DOMAIN || '').trim();

  return {
    httpOnly: true,
    secure,
    sameSite,
    path: '/',
    maxAge: Number.isFinite(maxAgeSeconds) && maxAgeSeconds > 0 ? maxAgeSeconds * 1000 : DEFAULT_MAX_AGE_SECONDS * 1000,
    ...(domain ? { domain } : {}),
  };
};

export const setAuthSessionCookie = (res: Response, token: string, req?: Request) => {
  if (!AUTH_COOKIE_NAME || !token) return;
  res.cookie(AUTH_COOKIE_NAME, token, buildAuthCookieOptions(req));
};

export const clearAuthSessionCookie = (res: Response, req?: Request) => {
  const options = buildAuthCookieOptions(req);
  res.clearCookie(AUTH_COOKIE_NAME, {
    path: options.path || '/',
    ...(options.domain ? { domain: options.domain } : {}),
    sameSite: options.sameSite,
    secure: options.secure,
    httpOnly: true,
  });
};
