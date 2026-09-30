import express from 'express';
import { upload } from '../middleware/upload.js';
import {
  createRecordingSession,
  uploadReactionChunk,
  finalizeReactionSession,
  markSessionIncomplete,
  uploadReaction,
  getAllReactions,
  getReactionByDay,
  validateDayAccess,
} from '../controllers/reactionController.js';

const router = express.Router();

// Continuous chunk recording endpoints
router.post('/reactions/session', createRecordingSession);
router.post('/reactions/:sessionId/chunk', upload.single('chunk'), uploadReactionChunk);
router.post('/reactions/:sessionId/finalize', finalizeReactionSession);
router.post('/reactions/:sessionId/incomplete', markSessionIncomplete);

// Legacy single-blob upload
router.post('/reactions', upload.single('reactionVideo'), uploadReaction);

// Get all reactions
router.get('/reactions', getAllReactions);

// Get single reaction by day number
router.get('/reactions/:day', getReactionByDay);

// Security date validation for a day
router.get('/day/:dayNumber', validateDayAccess);

export default router;
