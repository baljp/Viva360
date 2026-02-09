"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendPushSimulation = exports.markAllAsRead = exports.markAsRead = exports.list = void 0;
const async_middleware_1 = require("../middleware/async.middleware");
const notification_service_1 = require("../services/notification.service");
exports.list = (0, async_middleware_1.asyncHandler)(async (req, res) => {
    const userId = req.user?.userId;
    const notifications = await notification_service_1.notificationService.list(userId);
    return res.json(notifications);
});
exports.markAsRead = (0, async_middleware_1.asyncHandler)(async (req, res) => {
    const userId = req.user?.userId;
    const { id } = req.params;
    const result = await notification_service_1.notificationService.markAsRead(userId, id);
    return res.json(result);
});
exports.markAllAsRead = (0, async_middleware_1.asyncHandler)(async (req, res) => {
    const userId = req.user?.userId;
    const result = await notification_service_1.notificationService.markAllAsRead(userId);
    return res.json(result);
});
const sendPushSimulation = async (userId, title, message) => {
    await notification_service_1.notificationService.sendPushSimulation(userId, title, message);
};
exports.sendPushSimulation = sendPushSimulation;
