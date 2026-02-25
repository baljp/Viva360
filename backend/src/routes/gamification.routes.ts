import { Router } from 'express';
import { completeQuest, getLeaderboard, getState, syncAchievements } from '../controllers/gamification.controller';

const router = Router();

router.get('/state', getState);
router.get('/leaderboard', getLeaderboard);
router.post('/quests/:questId/complete', completeQuest);
router.post('/achievements/sync', syncAchievements);

export default router;
