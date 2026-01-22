import { Job } from 'bullmq';
import { createWorker, QUEUE_NAMES } from '../config/queue';
import { emailService } from '../services/email.service';

const processEmail = async (job: Job) => {
  const { to, subject, html } = job.data;
  console.log(`📨 Processing email job ${job.id} to ${to}`);
  try {
    await emailService.sendEmail(to, subject, html);
    console.log(`✅ Email sent to ${to}`);
  } catch (error) {
    console.error(`❌ Failed to send email to ${to}:`, error);
    throw error;
  }
};

// Initialize worker
export const emailWorker = createWorker(QUEUE_NAMES.EMAIL, processEmail);
