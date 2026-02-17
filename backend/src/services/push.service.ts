
// Using web-push library logic (mocked for now)
import { logger } from '../lib/logger';

export interface PushSubscriptionMock {
    endpoint: string;
    keys: {
        p256dh: string;
        auth: string;
    };
}

export class PushService {
    private static instance: PushService;

    private constructor() {}

    public static getInstance(): PushService {
        if (!PushService.instance) {
            PushService.instance = new PushService();
        }
        return PushService.instance;
    }

    async sendNotification(subscription: PushSubscriptionMock, payload: string) {
        logger.info('push.send', {
          endpointPrefix: subscription.endpoint.substring(0, 30),
          payloadLength: typeof payload === 'string' ? payload.length : 0,
          transport: 'MOCK_WEB_PUSH',
        });
        return true;
    }
}

export const pushService = PushService.getInstance();
