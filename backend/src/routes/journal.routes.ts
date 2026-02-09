import { Router } from 'express';
import * as JournalController from '../controllers/journal.controller';

const router = Router();

router.post('/', JournalController.createEntry);
router.get('/', JournalController.listEntries);
router.get('/stats', JournalController.getJournalStats);

export default router;

