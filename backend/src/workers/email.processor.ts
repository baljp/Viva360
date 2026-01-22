import { Job } from 'bullmq';
import { createWorker, QUEUE_NAMES } from '../config/queue';
import { emailService } from '../services/email.service';

interface EmailJobData {
  to: string;
  subject: string;
  html: string;
}

// Email worker processor
const processEmailJob = async (job: Job<EmailJobData>) => {
  const { to, subject, html } = job.data;
  
  console.log(`📧 Processing email job ${job.id} to ${to}`);
  
  try {
    await emailService.sendEmailDirect(to, subject, html);
    console.log(`✅ Email sent successfully: ${job.id}`);
  } catch (error) {
    console.error(`❌ Email failed: ${job.id}`, error);
    throw error; // Rethrow to trigger retry
  }
};

// Create and export the worker
export const emailWorker = createWorker(QUEUE_NAMES.EMAIL, processEmailJob);

// Event handlers
emailWorker.on('completed', (job) => {
  console.log(`📧 Email job ${job.id} completed`);
});

emailWorker.on('failed', (job, err) => {
  console.error(`❌ Email job ${job?.id} failed:`, err.message);
});

emailWorker.on('error', (err) => {
  console.error('Email worker error:', err);
});

console.log('📬 Email worker started');
