import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { requireAuth } from '../middleware/auth.js';
import Reaction from '../models/Reaction.js';
import { getJourneyDateString, getTodayInKolkata } from '../utils/dateUtils.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const videoDirectory = path.join(__dirname, '../../public/videos');
const router = express.Router();

function getVideoPath(dayNumber) {
  const fileName = dayNumber === 19 ? 'birthday.mp4' : `day-${String(dayNumber).padStart(2, '0')}.mp4`;
  return path.join(videoDirectory, fileName);
}

router.get('/videos/:dayNumber/details', requireAuth, async (req, res) => {
  const dayNumber = Number(req.params.dayNumber);
  if (!Number.isInteger(dayNumber) || dayNumber < 1 || dayNumber > 19) {
    return res.status(404).json({ day: dayNumber, available: false, videoUrl: null });
  }

  const date = getJourneyDateString(dayNumber);
  if (req.user.role !== 'OWNER' && date > getTodayInKolkata()) {
    return res.status(403).json({ error: 'This surprise is not available yet.' });
  }

  const videoPath = getVideoPath(dayNumber);
  const available = fs.existsSync(videoPath);
  res.set('Cache-Control', 'private, no-store');
  res.set('Vary', 'Cookie');
  return res.json({
    day: dayNumber,
    available,
    videoUrl: available ? `/api/videos/${dayNumber}/stream` : null,
  });
});

async function sendDailyVideo(req, res) {
  const dayNumber = Number(req.params.dayNumber);
  if (!Number.isInteger(dayNumber) || dayNumber < 1 || dayNumber > 19) {
    return res.status(404).json({ error: 'Video not found.' });
  }

  const date = getJourneyDateString(dayNumber);
  if (req.user.role !== 'OWNER' && date > getTodayInKolkata()) {
    return res.status(403).json({ error: 'This surprise is not available yet.' });
  }
  if (req.user.role === 'BOYFRIEND' && dayNumber < 19) {
    const { sessionId } = req.query;
    if (typeof sessionId !== 'string' || !/^[a-zA-Z0-9_-]+$/.test(sessionId)) {
      return res.status(403).json({ error: 'Start reaction recording before watching this surprise.' });
    }
    const session = await Reaction.findOne({
      sessionId,
      userId: req.user.userId,
      dayNumber,
      status: 'recording',
      chunksUploaded: { $gt: 0 },
    }).select('_id').lean();
    if (!session) return res.status(403).json({ error: 'Start reaction recording before watching this surprise.' });
  }

  const videoPath = getVideoPath(dayNumber);
  if (!fs.existsSync(videoPath)) return res.status(404).json({ error: 'Video not found.' });

  res.set('Cache-Control', 'private, no-store');
  res.set('Vary', 'Cookie');
  return res.sendFile(videoPath);
}

router.get('/videos/:dayNumber/stream', requireAuth, sendDailyVideo);
router.get('/videos/:dayNumber', requireAuth, sendDailyVideo);

export default router;
