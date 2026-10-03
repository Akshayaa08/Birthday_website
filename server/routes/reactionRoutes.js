import express from 'express';
import { upload } from '../middleware/upload.js';
import {
  createRecordingSession,
  uploadReactionChunk,
  finalizeReactionSession,
  markSessionIncomplete,
  handleReactionChunkUploadError,
  uploadReaction,
  getAllReactions,
  getReactionByDay,
  getReactionVideo,
  validateDayAccess,
} from '../controllers/reactionController.js';
import { requireAuth, requireRole, verifyRequestOrigin } from '../middleware/auth.js';

const router = express.Router();

// Continuous chunk recording endpoints
router.post('/reactions/session', verifyRequestOrigin, requireAuth, requireRole('BOYFRIEND'), createRecordingSession);
router.post(
  '/reactions/:sessionId/chunk',
  verifyRequestOrigin,
  requireAuth,
  requireRole('BOYFRIEND'),
  upload.single('chunk'),
  uploadReactionChunk,
  handleReactionChunkUploadError
);
router.post('/reactions/:sessionId/finalize', verifyRequestOrigin, requireAuth, requireRole('BOYFRIEND'), finalizeReactionSession);
router.post('/reactions/:sessionId/incomplete', verifyRequestOrigin, requireAuth, requireRole('BOYFRIEND'), markSessionIncomplete);

// Legacy single-blob upload
router.post('/reactions', verifyRequestOrigin, requireAuth, requireRole('BOYFRIEND'), upload.single('reactionVideo'), uploadReaction);

// Get all reactions
router.get('/reactions', requireAuth, requireRole('OWNER'), getAllReactions);

// Get single reaction by day number
router.get('/reactions/:sessionId/video', requireAuth, requireRole('OWNER'), getReactionVideo);
router.get('/reactions/:day', requireAuth, requireRole('OWNER'), getReactionByDay);

// Security date validation for a day
router.get('/day/:dayNumber', requireAuth, validateDayAccess);

export default router;
