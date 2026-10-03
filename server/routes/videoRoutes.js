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

function logVideoRequest(req, res, next) {
  res.on('finish', () => {
    console.info('[Video] Request completed', {
      requestUrl: req.originalUrl,
      dayNumber: req.params.dayNumber,
      sessionId: typeof req.query.sessionId === 'string' ? req.query.sessionId : null,
      userId: req.user?.userId || null,
      status: res.statusCode,
    });
  });
  next();
}

function getVideoPath(dayNumber) {
  const fileName = dayNumber === 19 ? 'birthday.mp4' : `day-${String(dayNumber).padStart(2, '0')}.mp4`;
  return path.join(videoDirectory, fileName);
}

router.get('/videos/:dayNumber/details', logVideoRequest, requireAuth, async (req, res) => {
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
  const videoExists = fs.existsSync(videoPath);
  console.info('[Video] Resolved video file', {
    requestUrl: req.originalUrl,
    dayNumber,
    sessionId: typeof req.query.sessionId === 'string' ? req.query.sessionId : null,
    userId: req.user?.userId || null,
    videoPath,
    exists: videoExists,
  });
  if (!videoExists) return res.status(404).json({ error: 'Video not found.' });

  res.set('Cache-Control', 'private, no-store');
  res.set('Vary', 'Cookie');
  res.set('Content-Type', 'video/mp4');
  res.set('Accept-Ranges', 'bytes');

  const fileSize = fs.statSync(videoPath).size;
  const rangeHeader = req.get('range');
  let start = 0;
  let end = fileSize - 1;

  if (rangeHeader) {
    const match = /^bytes=(\d*)-(\d*)$/.exec(rangeHeader.trim());
    if (!match || (!match[1] && !match[2]) || fileSize === 0) {
      res.set('Content-Range', `bytes */${fileSize}`);
      res.set('Content-Length', '0');
      return res.status(416).end();
    }

    if (!match[1]) {
      const suffixLength = Number(match[2]);
      if (!Number.isSafeInteger(suffixLength) || suffixLength <= 0) {
        res.set('Content-Range', `bytes */${fileSize}`);
        res.set('Content-Length', '0');
        return res.status(416).end();
      }
      start = Math.max(fileSize - suffixLength, 0);
    } else {
      start = Number(match[1]);
    }

    if (match[2] && match[1]) end = Number(match[2]);

    if (
      !Number.isSafeInteger(start) ||
      !Number.isSafeInteger(end) ||
      start < 0 ||
      start >= fileSize ||
      end < start
    ) {
      res.set('Content-Range', `bytes */${fileSize}`);
      res.set('Content-Length', '0');
      return res.status(416).end();
    }

    end = Math.min(end, fileSize - 1);
    res.status(206);
    res.set('Content-Range', `bytes ${start}-${end}/${fileSize}`);
  } else {
    res.status(200);
  }

  res.set('Content-Length', String(end - start + 1));
  const videoStream = fs.createReadStream(videoPath, { start, end });
  videoStream.on('error', (error) => {
    console.error('[Video] Stream failed', {
      dayNumber,
      sessionId: typeof req.query.sessionId === 'string' ? req.query.sessionId : null,
      userId: req.user?.userId || null,
      status: res.statusCode,
      message: error.message,
    });
    if (!res.headersSent) res.status(500).json({ error: 'Could not stream video.' });
    else res.destroy(error);
  });
  return videoStream.pipe(res);
}

router.get('/videos/:dayNumber/stream', logVideoRequest, requireAuth, sendDailyVideo);
router.get('/videos/:dayNumber', logVideoRequest, requireAuth, sendDailyVideo);

export default router;
