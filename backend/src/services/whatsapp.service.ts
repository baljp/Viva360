
import { logger } from '../lib/logger';

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
        logger.info('whatsapp.send', {
          to: msg.to,
          template: msg.template,
          // Avoid logging full text; keep length only.
          textLength: typeof msg.text === 'string' ? msg.text.length : 0,
          transport: 'MOCK_ZAP_NETWORK',
        });
        return true;
    }
}

export const whatsappService = WhatsAppService.getInstance();
