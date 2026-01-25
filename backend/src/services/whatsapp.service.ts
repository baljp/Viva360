
export interface WhatsAppMessage {
    to: string; // Phone number (e.g., 5511999999999)
    template?: string;
    text?: string;
}

export class WhatsAppService {
    private static instance: WhatsAppService;
    
    // Mock connected state
    private isConnected: boolean = true; 

    private constructor() {}

    public static getInstance(): WhatsAppService {
        if (!WhatsAppService.instance) {
            WhatsAppService.instance = new WhatsAppService();
        }
        return WhatsAppService.instance;
    }

    async send(msg: WhatsAppMessage): Promise<boolean> {
        // In reality, this would connect to Twilio / WPPConnect / Baileys
        console.log(`\n📱 [WHATSAPP] Sending to ${msg.to}`);
        if(msg.template) console.log(`   Template: ${msg.template}`);
        if(msg.text) console.log(`   Text: ${msg.text}`);
        
        console.log(`   ✅ Sent via [MOCK_ZAP_NETWORK]`);
        return true;
    }
}

export const whatsappService = WhatsAppService.getInstance();
