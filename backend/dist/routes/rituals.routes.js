"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const rituals_controller_1 = require("../controllers/rituals.controller");
const router = (0, express_1.Router)();
router.post('/', rituals_controller_1.saveRoutine);
router.get('/', rituals_controller_1.getRoutine);
exports.default = router;
