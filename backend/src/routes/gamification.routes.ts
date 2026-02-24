import { Router } from 'express';
import { completeQuest, getState, syncAchievements } from '../controllers/gamification.controller';

const router = Router();

router.get('/state', getState);
router.post('/quests/:questId/complete', completeQuest);
router.post('/achievements/sync', syncAchievements);

export default router;

