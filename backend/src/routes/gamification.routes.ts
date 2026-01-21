import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import * as gamification from '../controllers/gamification.controller';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// Achievements
router.get('/achievements', gamification.getAchievements);
router.post('/achievements', gamification.unlockAchievement);

// Challenges
router.get('/challenges', gamification.getChallenges);
router.post('/challenges/:id/join', gamification.joinChallenge);
router.patch('/challenges/:id/progress', gamification.updateChallengeProgress);

// Leaderboard
router.get('/leaderboard', gamification.getLeaderboard);

// Streak & Plant
router.post('/streak', gamification.updateStreak);
router.post('/plant', gamification.updatePlantProgress);

export default router;
