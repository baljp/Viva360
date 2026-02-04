"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const executive_controller_1 = require("../controllers/executive.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const admin_middleware_1 = require("../middleware/admin.middleware"); // Assuming it exists or using similar role check
const router = (0, express_1.Router)();
// Only Admins can see raw business metrics
router.get('/metrics', auth_middleware_1.authenticateUser, admin_middleware_1.adminOnlyMiddleware, executive_controller_1.getExecutiveMetrics);
exports.default = router;
