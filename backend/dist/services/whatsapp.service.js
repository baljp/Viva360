"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.whatsappService = exports.WhatsAppService = void 0;
class WhatsAppService {
    constructor() {
        // Mock connected state
        this.isConnected = true;
    }
    static getInstance() {
        if (!WhatsAppService.instance) {
            WhatsAppService.instance = new WhatsAppService();
        }
        return WhatsAppService.instance;
    }
    async send(msg) {
        // In reality, this would connect to Twilio / WPPConnect / Baileys
        console.log(`\n📱 [WHATSAPP] Sending to ${msg.to}`);
        if (msg.template)
            console.log(`   Template: ${msg.template}`);
        if (msg.text)
            console.log(`   Text: ${msg.text}`);
        console.log(`   ✅ Sent via [MOCK_ZAP_NETWORK]`);
        return true;
    }
}
exports.WhatsAppService = WhatsAppService;
exports.whatsappService = WhatsAppService.getInstance();
