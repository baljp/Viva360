import { Router } from 'express';
import * as ritualsController from '../controllers/rituals.controller';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// All ritual routes require authentication
router.use(authenticateToken);

// Daily Check-in / Morning Ritual
router.post('/check-in', ritualsController.performDailyCheckIn);
router.get('/status', ritualsController.getRitualStatus);

// Plant Care
router.post('/water', ritualsController.waterPlant);

// Daily Quests
router.get('/quests', ritualsController.getDailyQuests);

// Breathing Exercise
router.post('/breathe', ritualsController.completeBreathingExercise);

// Gratitude
router.post('/gratitude', ritualsController.recordGratitude);

export default router;
