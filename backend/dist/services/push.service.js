"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pushService = exports.PushService = void 0;
class PushService {
    constructor() { }
    static getInstance() {
        if (!PushService.instance) {
            PushService.instance = new PushService();
        }
        return PushService.instance;
    }
    async sendNotification(subscription, payload) {
        console.log(`\n🔔 [PUSH NOTIFICATION]`);
        console.log(`   Endpoint: ${subscription.endpoint.substring(0, 30)}...`);
        console.log(`   Payload: ${payload}`);
        console.log(`   ✅ Sent via [MOCK_WEB_PUSH]`);
        return true;
    }
}
exports.PushService = PushService;
exports.pushService = PushService.getInstance();
