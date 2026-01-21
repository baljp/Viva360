import prisma from '../config/database';

// In-memory token blacklist (use Redis in production for scalability)
const tokenBlacklist = new Set<string>();

// Token expiry tracking (cleanup old tokens)
const tokenExpiry = new Map<string, number>();

/**
 * Add a token to the blacklist
 */
export const blacklistToken = (token: string, expiresIn: number = 3600) => {
  tokenBlacklist.add(token);
  tokenExpiry.set(token, Date.now() + expiresIn * 1000);
  
  // Schedule cleanup
  setTimeout(() => {
    tokenBlacklist.delete(token);
    tokenExpiry.delete(token);
  }, expiresIn * 1000);
};

/**
 * Check if a token is blacklisted
 */
export const isTokenBlacklisted = (token: string): boolean => {
  // Check if expired and clean up
  const expiry = tokenExpiry.get(token);
  if (expiry && Date.now() > expiry) {
    tokenBlacklist.delete(token);
    tokenExpiry.delete(token);
    return false;
  }
  return tokenBlacklist.has(token);
};

/**
 * Blacklist all tokens for a user (force logout from all devices)
 */
export const blacklistAllUserTokens = async (userId: string) => {
  // In production, you would store issued tokens in DB and blacklist all
  // For now, we use a user-specific blacklist timestamp
  await prisma.user.update({
    where: { id: userId },
    data: { 
      // Add a timestamp that invalidates all tokens issued before
      updatedAt: new Date() 
    },
  });
};

/**
 * Clean up expired tokens periodically
 */
export const cleanupBlacklist = () => {
  const now = Date.now();
  for (const [token, expiry] of tokenExpiry.entries()) {
    if (now > expiry) {
      tokenBlacklist.delete(token);
      tokenExpiry.delete(token);
    }
  }
};

// Run cleanup every 5 minutes
setInterval(cleanupBlacklist, 5 * 60 * 1000);

/**
 * Get blacklist stats (for monitoring)
 */
export const getBlacklistStats = () => ({
  size: tokenBlacklist.size,
  memory: process.memoryUsage().heapUsed,
});
