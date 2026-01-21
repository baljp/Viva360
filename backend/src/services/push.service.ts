import webpush from 'web-push';

const publicVapidKey = process.env.VAPID_PUBLIC_KEY;
const privateVapidKey = process.env.VAPID_PRIVATE_KEY;

if (publicVapidKey && privateVapidKey) {
    try {
        webpush.setVapidDetails(
        process.env.VAPID_SUBJECT || 'mailto:admin@viva360.com',
        publicVapidKey,
        privateVapidKey
        );
    } catch (e) {
        console.error("Failed to set VAPID details", e);
    }
}

export class PushService {
  async sendNotification(subscription: any, payload: string) {
    try {
      if (!publicVapidKey || !privateVapidKey) {
          console.warn('VAPID keys not configured, skipping push notification');
          return;
      }
      await webpush.sendNotification(subscription, payload);
    } catch (error) {
      console.error('Error sending push notification:', error);
    }
  }
}

export const pushService = new PushService();
