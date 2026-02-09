"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireSameUserOrAdmin = exports.requireRoles = void 0;
const normalizeRole = (value) => String(value || '').trim().toUpperCase();
const requireRoles = (...roles) => {
    const allowed = new Set(roles.map((role) => normalizeRole(role)));
    return (req, res, next) => {
        const role = normalizeRole(req.user?.role);
        if (!role || !allowed.has(role)) {
            return res.status(403).json({
                error: 'Forbidden: insufficient role',
                code: 'ROLE_NOT_ALLOWED',
            });
        }
        return next();
    };
};
exports.requireRoles = requireRoles;
const requireSameUserOrAdmin = (getTargetUserId) => {
    return (req, res, next) => {
        const role = normalizeRole(req.user?.role);
        const authUserId = String(req.user?.userId || req.user?.id || '');
        const targetUserId = String(getTargetUserId(req) || '');
        if (role === 'ADMIN' || (authUserId && targetUserId && authUserId === targetUserId)) {
            return next();
        }
        return res.status(403).json({
            error: 'Forbidden: user mismatch',
            code: 'USER_SCOPE_MISMATCH',
        });
    };
};
exports.requireSameUserOrAdmin = requireSameUserOrAdmin;
