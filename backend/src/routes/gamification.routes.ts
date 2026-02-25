import { Router } from 'express';
import { completeQuest, getLeaderboard, getState, syncAchievements, getKarmaHistory } from '../controllers/gamification.controller';

const router = Router();

router.get('/state', getState);
router.get('/leaderboard', getLeaderboard);
router.post('/quests/:questId/complete', completeQuest);
router.post('/achievements/sync', syncAchievements);
router.get('/history', getKarmaHistory);

export default router;
