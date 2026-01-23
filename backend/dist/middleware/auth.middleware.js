"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticateUser = void 0;
const supabase_service_1 = require("../services/supabase.service");
const authenticateUser = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ error: 'Missing Authorization header' });
    }
    const token = authHeader.split(' ')[1];
    if (!token) {
        return res.status(401).json({ error: 'Invalid Authorization header format' });
    }
    try {
        const { data: { user }, error } = await supabase_service_1.supabaseAdmin.auth.getUser(token);
        if (error || !user) {
            return res.status(401).json({ error: 'Invalid or expired token' });
        }
        // Attach user to request
        req.user = user;
        next();
    }
    catch (err) {
        console.error('Auth middleware error:', err);
        return res.status(500).json({ error: 'Internal Server Error during authentication' });
    }
};
exports.authenticateUser = authenticateUser;
