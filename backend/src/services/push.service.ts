
// Using web-push library logic (mocked for now)
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
        console.log(`\n🔔 [PUSH NOTIFICATION]`);
        console.log(`   Endpoint: ${subscription.endpoint.substring(0, 30)}...`);
        console.log(`   Payload: ${payload}`);
        console.log(`   ✅ Sent via [MOCK_WEB_PUSH]`);
        return true;
    }
}

export const pushService = PushService.getInstance();
