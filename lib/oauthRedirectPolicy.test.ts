import { describe, expect, it } from 'vitest';
import { parseAllowedOriginPatterns, parseAllowedOrigins, resolveOAuthRedirectPolicy } from './oauthRedirectPolicy';

describe('oauthRedirectPolicy', () => {
  it('normalizes and deduplicates allowed origins', () => {
    const origins = parseAllowedOrigins('https://viva360.vercel.app, https://viva360.vercel.app/login,invalid,http://localhost:5173');
    expect(origins).toEqual(['https://viva360.vercel.app', 'http://localhost:5173']);
  });

  it('normalizes wildcard origin patterns', () => {
    expect(parseAllowedOriginPatterns('https://*.vercel.app, https://*.vercel.app, invalid')).toEqual([
      'https://*.vercel.app',
    ]);
  });

  it('keeps configured redirect when allowlisted and safe', () => {
    const result = resolveOAuthRedirectPolicy({
      configuredRedirect: 'https://viva360.vercel.app/login',
      currentOrigin: 'https://viva360.vercel.app',
      allowedOrigins: ['https://viva360.vercel.app'],
      enforceSameOrigin: true,
      productionRuntime: true,
    });

    expect(result.usedFallback).toBe(false);
    expect(result.redirectUrl).toBe('https://viva360.vercel.app/login');
    expect(result.issues).toEqual([]);
  });

  it('falls back when configured redirect is external', () => {
    const result = resolveOAuthRedirectPolicy({
      configuredRedirect: 'https://evil.example.com/login',
      currentOrigin: 'https://viva360.vercel.app',
      allowedOrigins: ['https://viva360.vercel.app'],
      enforceSameOrigin: true,
      productionRuntime: true,
    });

    expect(result.usedFallback).toBe(true);
    expect(result.redirectUrl).toBe('https://viva360.vercel.app/login');
    expect(result.issues.some((issue) => issue.includes('allowlisted'))).toBe(true);
  });

  it('falls back when configured redirect contains query/hash', () => {
    const result = resolveOAuthRedirectPolicy({
      configuredRedirect: 'https://viva360.vercel.app/login?next=/admin#abc',
      currentOrigin: 'https://viva360.vercel.app',
      allowedOrigins: ['https://viva360.vercel.app'],
      enforceSameOrigin: true,
      productionRuntime: true,
    });

    expect(result.usedFallback).toBe(true);
    expect(result.redirectUrl).toBe('https://viva360.vercel.app/login');
    expect(result.issues.some((issue) => issue.includes('query'))).toBe(true);
    expect(result.issues.some((issue) => issue.includes('hash'))).toBe(true);
  });

  it('uses localhost fallback when origin unavailable', () => {
    const result = resolveOAuthRedirectPolicy({
      configuredRedirect: 'not-an-url',
      currentOrigin: '',
      allowedOrigins: [],
      enforceSameOrigin: false,
      productionRuntime: false,
    });

    expect(result.redirectUrl).toBe('http://localhost:5173/login');
  });

  it('prefers runtime preview domain when wildcard is allowlisted', () => {
    const result = resolveOAuthRedirectPolicy({
      configuredRedirect: 'https://viva360.vercel.app/login',
      currentOrigin: 'https://viva360-git-feature-123.vercel.app',
      allowedOrigins: ['https://viva360.vercel.app'],
      allowedOriginPatterns: ['https://*.vercel.app'],
      preferRuntimeOriginWhenAllowed: true,
      enforceSameOrigin: false,
      productionRuntime: true,
    });

    expect(result.usedFallback).toBe(false);
    expect(result.redirectUrl).toBe('https://viva360-git-feature-123.vercel.app/login');
  });
});
