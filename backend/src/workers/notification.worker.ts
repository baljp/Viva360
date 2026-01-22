import { Job } from 'bullmq';
import { createWorker, QUEUE_NAMES } from '../config/queue';
import prisma from '../config/database';

// We assume the DB record is created transactionally by the controller. 
// This worker handles the "Side Effects" (Push notifications, etc.)
interface NotificationJobData {
    userId: string;
    title: string;
    message: string;
    // We might pass the notificationId if we want to update its status to 'SENT' later
    notificationId?: string; 
}

const processNotification = async (job: Job<NotificationJobData>) => {
  const { userId, title, message } = job.data;
  console.log(`🔔 Processing notification delivery job ${job.id} to ${userId}`);
  
  try {
    // 1. Send Push Notification (Mock or Real Service)
    // await pushService.send(userId, title, message);
    
    // For now just log, as we are simulation
    // console.log(`📲 PUSH sent to ${userId}: "${title}"`);

  } catch (error) {
    console.error(`❌ Failed to deliver notification for ${userId}:`, error);
    throw error;
  }
};

// Initialize worker
export const notificationWorker = createWorker(QUEUE_NAMES.NOTIFICATIONS, processNotification);
