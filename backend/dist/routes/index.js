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
const marketplace_routes_1 = __importDefault(require("./marketplace.routes"));
const router = (0, express_1.Router)();
// Public Routes
router.get('/ping', (req, res) => {
    res.json({ message: 'pong' });
});
router.use('/auth', auth_routes_1.default);
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
router.use('/tribe', auth_middleware_1.authenticateUser, tribe_routes_1.default);
router.use('/alchemy', auth_middleware_1.authenticateUser, alchemy_routes_1.default);
router.use('/marketplace', auth_middleware_1.authenticateUser, marketplace_routes_1.default);
// Protected Routes (Example)
router.use('/protected', auth_middleware_1.authenticateUser, (req, res) => {
    res.json({ message: 'You have access!', user: req.user });
});
// We will mount other routes here as we build them.
// router.use('/appointments', appointmentsRoutes);
// router.use('/marketplace', marketplaceRoutes);
exports.default = router;
