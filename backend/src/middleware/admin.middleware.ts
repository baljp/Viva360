import { Request, Response, NextFunction } from 'express';

/**
 * Middleware to restrict access to ADMIN users only.
 */
export const adminOnlyMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;
    
    // Normalize role to string and trim
    const role = String(user?.role || '').trim().toUpperCase();

    if (user && role === 'ADMIN') {
        // Attach adminId for downstream controllers
        req.body.adminId = user.userId || user.id || 'admin_master';
        return next();
    }

    // Diagnostic log for production-grade troubleshooting
    console.warn(`🔒 [ADMIN AUTH] Unauthorized access attempt. UserID: ${user?.id || 'anonymous'}, Role: ${role}`);
    
    return res.status(403).json({ 
        error: 'Forbidden: Admin access required',
        code: 'INSUFFICIENT_PERMISSIONS'
    });
};
