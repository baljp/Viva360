"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const oracle_controller_1 = require("../controllers/oracle.controller");
const cache_middleware_1 = require("../middleware/cache.middleware");
const router = (0, express_1.Router)();
router.post('/draw', oracle_controller_1.drawCard);
router.get('/history', (0, cache_middleware_1.cacheMiddleware)(3600), oracle_controller_1.getHistory); // Cache for 1 hour
exports.default = router;
