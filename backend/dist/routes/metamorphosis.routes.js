"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const metamorphosis_controller_1 = require("../controllers/metamorphosis.controller");
const router = (0, express_1.Router)();
router.post('/checkin', metamorphosis_controller_1.checkIn);
router.get('/evolution', metamorphosis_controller_1.getEvolution);
exports.default = router;
