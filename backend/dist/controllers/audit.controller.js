"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listLogs = void 0;
const async_middleware_1 = require("../middleware/async.middleware");
const audit_service_1 = require("../services/audit.service");
exports.listLogs = (0, async_middleware_1.asyncHandler)(async (req, res) => {
    const actorId = req.user?.userId;
    const logs = await audit_service_1.auditService.getEventsByActor(actorId, 100);
    return res.json(logs);
});
