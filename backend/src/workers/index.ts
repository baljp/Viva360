import { emailWorker } from './email.worker';
import { notificationWorker } from './notification.worker';

export const initWorkers = () => {
    if (emailWorker) console.log('👷 Email worker started');
    if (notificationWorker) console.log('👷 Notification worker started');
};
