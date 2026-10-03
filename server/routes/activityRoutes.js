import express from 'express';
import { getJourneyActivity, recordVideoCompleted, recordVideoSeen, recordVideoWatching } from '../controllers/activityController.js';
import { requireAuth, requireRole, verifyRequestOrigin } from '../middleware/auth.js';

const router = express.Router();

router.post('/journey/:dayNumber/seen', verifyRequestOrigin, requireAuth, requireRole('BOYFRIEND'), recordVideoSeen);
router.post('/journey/:dayNumber/watching', verifyRequestOrigin, requireAuth, requireRole('BOYFRIEND'), recordVideoWatching);
router.post('/journey/:dayNumber/completed', verifyRequestOrigin, requireAuth, requireRole('BOYFRIEND'), recordVideoCompleted);
router.get('/admin/activity', requireAuth, requireRole('OWNER'), getJourneyActivity);

export default router;
