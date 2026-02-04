"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const auth_routes_1 = __importDefault(require("./auth.routes"));
const profile_routes_1 = __importDefault(require("./profile.routes"));
const appointments_routes_1 = __importDefault(require("./appointments.routes"));
const rituals_routes_1 = __importDefault(require("./rituals.routes"));
const finance_routes_1 = __importDefault(require("./finance.routes"));
const rooms_routes_1 = __importDefault(require("./rooms.routes"));
const notifications_routes_1 = __importDefault(require("./notifications.routes"));
const checkout_routes_1 = __importDefault(require("./checkout.routes"));
const chat_routes_1 = __importDefault(require("./chat.routes"));
const calendar_routes_1 = __importDefault(require("./calendar.routes"));
const tribe_routes_1 = __importDefault(require("./tribe.routes"));
const alchemy_routes_1 = __importDefault(require("./alchemy.routes"));
const oracle_routes_1 = __importDefault(require("./oracle.routes"));
const marketplace_routes_1 = __importDefault(require("./marketplace.routes"));
const records_routes_1 = __importDefault(require("./records.routes"));
const rateLimiter_1 = require("../middleware/rateLimiter");
const swr_middleware_1 = require("../middleware/swr.middleware");
const admin_routes_1 = __importDefault(require("./admin.routes"));
const executive_routes_1 = __importDefault(require("./executive.routes"));
const router = (0, express_1.Router)();
router.use(rateLimiter_1.rateLimiter); // Upgrade 9.5: Global Rate Limit
// Public Routes
router.get('/ping', (req, res) => {
    res.json({ message: 'pong' });
});
router.use('/auth', auth_routes_1.default);
// Protected Routes
router.use('/rituals', auth_middleware_1.authenticateUser, rituals_routes_1.default);
router.use('/finance', auth_middleware_1.authenticateUser, finance_routes_1.default);
router.use('/rooms', auth_middleware_1.authenticateUser, rooms_routes_1.default);
router.use('/profiles', auth_middleware_1.authenticateUser, profile_routes_1.default);
router.use('/appointments', auth_middleware_1.authenticateUser, appointments_routes_1.default);
// New Feature Routes
router.use('/notifications', auth_middleware_1.authenticateUser, notifications_routes_1.default);
router.use('/checkout', auth_middleware_1.authenticateUser, checkout_routes_1.default);
router.use('/chat', auth_middleware_1.authenticateUser, chat_routes_1.default);
router.use('/calendar', auth_middleware_1.authenticateUser, calendar_routes_1.default);
router.use('/tribe', auth_middleware_1.authenticateUser, (0, swr_middleware_1.swrMiddleware)(1, 59), tribe_routes_1.default);
router.use('/alchemy', auth_middleware_1.authenticateUser, alchemy_routes_1.default);
router.use('/marketplace', auth_middleware_1.authenticateUser, (0, swr_middleware_1.swrMiddleware)(1, 59), marketplace_routes_1.default);
router.use('/oracle', auth_middleware_1.authenticateUser, oracle_routes_1.default);
router.use('/records', auth_middleware_1.authenticateUser, records_routes_1.default);
// Admin
router.use('/admin', auth_middleware_1.authenticateUser, admin_routes_1.default);
router.use('/admin/executive', auth_middleware_1.authenticateUser, executive_routes_1.default);
const metamorphosis_routes_1 = __importDefault(require("./metamorphosis.routes"));
const profileLinks_routes_1 = __importDefault(require("./profileLinks.routes"));
const presence_routes_1 = __importDefault(require("./presence.routes"));
// ... (other imports)
router.use('/metamorphosis', auth_middleware_1.authenticateUser, metamorphosis_routes_1.default);
router.use('/links', auth_middleware_1.authenticateUser, profileLinks_routes_1.default);
router.use('/presence', presence_routes_1.default); // Presence can be partially public
exports.default = router;
