import { Router, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { asyncHandler } from '../middleware/error';
import prisma from '../config/database';
import { redis, isRedisAvailable } from '../config/redis';

const router = Router();

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  version: string;
  checks: Record<string, ComponentHealth>;
}

interface ComponentHealth {
  status: 'up' | 'down' | 'degraded';
  latency?: number;
  message?: string;
}

/**
 * GET /api/health/live
 * Kubernetes liveness probe - always returns 200 if process is running
 */
router.get('/live', (req, res) => {
  res.status(200).json({ status: 'alive', timestamp: new Date().toISOString() });
});

/**
 * GET /api/health/ready
 * Kubernetes readiness probe - checks if app can serve traffic
 */
router.get('/ready', asyncHandler(async (req, res: Response) => {
  const checks: Record<string, ComponentHealth> = {};
  
  // Check database
  const dbStart = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.database = { status: 'up', latency: Date.now() - dbStart };
  } catch (e) {
    checks.database = { status: 'down', message: 'Database unreachable' };
  }

  // Check Redis (optional)
  const redisStart = Date.now();
  const redisUp = await isRedisAvailable();
  checks.redis = redisUp 
    ? { status: 'up', latency: Date.now() - redisStart }
    : { status: 'degraded', message: 'Redis unavailable, using memory fallback' };

  // Overall status
  const isReady = checks.database.status === 'up';
  
  res.status(isReady ? 200 : 503).json({
    status: isReady ? 'ready' : 'not_ready',
    timestamp: new Date().toISOString(),
    checks,
  });
}));

/**
 * GET /api/health/deep
 * Full system diagnostics with all component statuses
 */
router.get('/deep', asyncHandler(async (req, res: Response) => {
  const startTime = Date.now();
  const checks: Record<string, ComponentHealth> = {};

  // 1. Database health
  const dbStart = Date.now();
  try {
    const dbResult = await prisma.$queryRaw<[{count: bigint}]>`SELECT COUNT(*) as count FROM "User"`;
    checks.database = { 
      status: 'up', 
      latency: Date.now() - dbStart,
      message: `${Number(dbResult[0]?.count || 0)} users in database`
    };
  } catch (e) {
    checks.database = { status: 'down', message: String(e) };
  }

  // 2. Redis health
  const redisStart = Date.now();
  try {
    const redisUp = await isRedisAvailable();
    if (redisUp && redis) {
      const info = await redis.info('memory');
      checks.redis = { status: 'up', latency: Date.now() - redisStart };
    } else {
      checks.redis = { status: 'degraded', message: 'Using memory fallback' };
    }
  } catch (e) {
    checks.redis = { status: 'degraded', message: 'Redis not configured' };
  }

  // 3. Memory usage
  const memUsage = process.memoryUsage();
  checks.memory = {
    status: memUsage.heapUsed < 500 * 1024 * 1024 ? 'up' : 'degraded',
    message: `Heap: ${Math.round(memUsage.heapUsed / 1024 / 1024)}MB / RSS: ${Math.round(memUsage.rss / 1024 / 1024)}MB`
  };

  // 4. Event loop lag
  const lagStart = Date.now();
  await new Promise(resolve => setImmediate(resolve));
  const eventLoopLag = Date.now() - lagStart;
  checks.eventLoop = {
    status: eventLoopLag < 100 ? 'up' : eventLoopLag < 500 ? 'degraded' : 'down',
    latency: eventLoopLag,
    message: `${eventLoopLag}ms lag`
  };

  // Calculate overall status
  const statuses = Object.values(checks).map(c => c.status);
  let overallStatus: HealthStatus['status'] = 'healthy';
  if (statuses.includes('down')) overallStatus = 'unhealthy';
  else if (statuses.includes('degraded')) overallStatus = 'degraded';

  const response: HealthStatus = {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version || '2.0.0',
    checks,
  };

  res.status(overallStatus === 'unhealthy' ? 503 : 200).json(response);
}));

/**
 * GET /api/health/metrics
 * Prometheus-compatible metrics output (using prom-client)
 */
import { getMetrics } from '../middleware/metrics';
router.get('/metrics', getMetrics);

export default router;
