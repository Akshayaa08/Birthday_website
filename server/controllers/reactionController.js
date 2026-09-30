import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import cloudinary, { isCloudinaryConfigured } from '../config/cloudinary.js';
import Reaction from '../models/Reaction.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.join(__dirname, '../../uploads');
const sessionsDir = path.join(uploadsDir, 'sessions');

// Ensure base upload & session directories exist
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
if (!fs.existsSync(sessionsDir)) {
  fs.mkdirSync(sessionsDir, { recursive: true });
}

// In-memory fallback if MongoDB is not connected
let memoryReactions = [];

/**
 * 1. Create a Recording Session
 * POST /api/reactions/session
 * Body: { sessionId, dayNumber, date }
 */
export async function createRecordingSession(req, res) {
  try {
    const { sessionId, dayNumber, date } = req.body;

    if (!sessionId || !dayNumber || !date) {
      return res.status(400).json({ error: 'sessionId, dayNumber, and date are required.' });
    }

    // Ensure session directory exists for storing chunks
    const sessionPath = path.join(sessionsDir, sessionId);
    if (!fs.existsSync(sessionPath)) {
      fs.mkdirSync(sessionPath, { recursive: true });
    }

    const sessionData = {
      sessionId,
      dayNumber: Number(dayNumber),
      date,
      status: 'recording',
      startedAt: new Date(),
      chunksUploaded: 0,
      reactionVideoUrl: '',
      cloudinaryPublicId: '',
    };

    // Save in MongoDB if available
    try {
      const doc = await Reaction.findOneAndUpdate(
        { sessionId },
        sessionData,
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );

      return res.status(201).json({
        success: true,
        message: 'Recording session created ❤️',
        session: doc,
      });
    } catch (dbErr) {
      console.warn('MongoDB session save fallback (in-memory):', dbErr.message);
      memoryReactions = memoryReactions.filter((r) => r.sessionId !== sessionId);
      memoryReactions.push(sessionData);

      return res.status(201).json({
        success: true,
        message: 'Recording session created (cached) ❤️',
        session: sessionData,
      });
    }
  } catch (err) {
    console.error('Error creating recording session:', err);
    return res.status(500).json({ error: 'Failed to create recording session.' });
  }
}

/**
 * 2. Upload Reaction Chunk
 * POST /api/reactions/:sessionId/chunk
 * FormData: chunk (file), chunkNumber, dayNumber
 */
export async function uploadReactionChunk(req, res) {
  try {
    const { sessionId } = req.params;
    const { chunkNumber = 0, dayNumber } = req.body;
    const file = req.file;

    if (!sessionId) {
      return res.status(400).json({ error: 'sessionId param is required.' });
    }

    if (!file || !file.buffer) {
      return res.status(400).json({ error: 'No video chunk file provided.' });
    }

    // Write chunk directly to disk
    const sessionPath = path.join(sessionsDir, sessionId);
    if (!fs.existsSync(sessionPath)) {
      fs.mkdirSync(sessionPath, { recursive: true });
    }

    const chunkFileName = `chunk_${String(chunkNumber).padStart(6, '0')}.webm`;
    const chunkFilePath = path.join(sessionPath, chunkFileName);
    fs.writeFileSync(chunkFilePath, file.buffer);

    const chunkIndex = Number(chunkNumber);

    // Update MongoDB document
    try {
      const updatedDoc = await Reaction.findOneAndUpdate(
        { sessionId },
        {
          $inc: { chunksUploaded: 1 },
          $setOnInsert: {
            sessionId,
            dayNumber: dayNumber ? Number(dayNumber) : 1,
            status: 'recording',
            startedAt: new Date(),
          },
        },
        { upsert: true, new: true }
      );

      return res.status(200).json({
        success: true,
        sessionId,
        chunkNumber: chunkIndex,
        chunksUploaded: updatedDoc.chunksUploaded,
      });
    } catch (dbErr) {
      // Memory fallback
      const found = memoryReactions.find((r) => r.sessionId === sessionId);
      if (found) {
        found.chunksUploaded = (found.chunksUploaded || 0) + 1;
      }
      return res.status(200).json({
        success: true,
        sessionId,
        chunkNumber: chunkIndex,
        chunksUploaded: found ? found.chunksUploaded : chunkIndex + 1,
      });
    }
  } catch (err) {
    console.error('Error saving reaction chunk:', err);
    return res.status(500).json({ error: 'Failed to save reaction chunk.' });
  }
}

/**
 * 3. Finalize Recording Session
 * POST /api/reactions/:sessionId/finalize
 * Body: { dayNumber, date }
 */
export async function finalizeReactionSession(req, res) {
  try {
    const { sessionId } = req.params;
    const { dayNumber, date } = req.body;

    if (!sessionId) {
      return res.status(400).json({ error: 'sessionId param is required.' });
    }

    const sessionPath = path.join(sessionsDir, sessionId);

    // Gather all chunks for this session
    let chunkFiles = [];
    if (fs.existsSync(sessionPath)) {
      chunkFiles = fs.readdirSync(sessionPath).filter((f) => f.startsWith('chunk_'));
      chunkFiles.sort(); // Lexicographical sort works because of 6-digit zero padding
    }

    let finalBuffer = null;
    if (chunkFiles.length > 0) {
      const buffers = chunkFiles.map((file) => fs.readFileSync(path.join(sessionPath, file)));
      finalBuffer = Buffer.concat(buffers);
    }

    let videoUrl = '';
    let publicId = '';

    // If we have video data, try uploading to Cloudinary
    if (finalBuffer && isCloudinaryConfigured()) {
      try {
        const uploadResult = await new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            {
              resource_type: 'video',
              folder: 'romantic_reactions',
              public_id: `reaction_day_${dayNumber || 'x'}_${sessionId}`,
            },
            (error, uploaded) => {
              if (error) return reject(error);
              resolve(uploaded);
            }
          );
          stream.end(finalBuffer);
        });

        videoUrl = uploadResult.secure_url;
        publicId = uploadResult.public_id;
      } catch (cloudErr) {
        console.warn('Cloudinary upload error, using local fallback:', cloudErr.message);
      }
    }

    // Local fallback: save the stitched file in uploads/
    if (finalBuffer && !videoUrl) {
      const finalFileName = `reaction-day-${dayNumber || 1}-${sessionId}.webm`;
      const finalFilePath = path.join(uploadsDir, finalFileName);
      fs.writeFileSync(finalFilePath, finalBuffer);
      videoUrl = `/uploads/${finalFileName}`;
      publicId = finalFileName;
    }

    // Update session record in MongoDB
    const updateData = {
      status: 'completed',
      completedAt: new Date(),
      reactionVideoUrl: videoUrl,
      cloudinaryPublicId: publicId,
    };
    if (dayNumber) updateData.dayNumber = Number(dayNumber);
    if (date) updateData.date = date;

    try {
      const finalizedDoc = await Reaction.findOneAndUpdate(
        { sessionId },
        updateData,
        { new: true, upsert: true }
      );

      return res.status(200).json({
        success: true,
        message: 'Reaction recording finalized and saved ❤️',
        reaction: finalizedDoc,
      });
    } catch (dbErr) {
      // Memory fallback
      let memDoc = memoryReactions.find((r) => r.sessionId === sessionId);
      if (!memDoc) {
        memDoc = { sessionId, dayNumber: Number(dayNumber) || 1, date: date || '', ...updateData };
        memoryReactions.push(memDoc);
      } else {
        Object.assign(memDoc, updateData);
      }

      return res.status(200).json({
        success: true,
        message: 'Reaction recording finalized (cached) ❤️',
        reaction: memDoc,
      });
    }
  } catch (err) {
    console.error('Error finalizing reaction session:', err);
    return res.status(500).json({ error: 'Failed to finalize reaction session.' });
  }
}

/**
 * 4. Mark Session Incomplete (e.g., user navigates away or connection cancelled)
 * POST /api/reactions/:sessionId/incomplete
 */
export async function markSessionIncomplete(req, res) {
  try {
    const { sessionId } = req.params;
    if (!sessionId) {
      return res.status(400).json({ error: 'sessionId param is required.' });
    }

    try {
      const updatedDoc = await Reaction.findOneAndUpdate(
        { sessionId, status: 'recording' },
        { status: 'incomplete' },
        { new: true }
      );
      return res.status(200).json({
        success: true,
        message: 'Session marked as incomplete, chunks preserved.',
        session: updatedDoc,
      });
    } catch (dbErr) {
      const mem = memoryReactions.find((r) => r.sessionId === sessionId);
      if (mem && mem.status === 'recording') {
        mem.status = 'incomplete';
      }
      return res.status(200).json({
        success: true,
        message: 'Session marked as incomplete (cached).',
      });
    }
  } catch (err) {
    return res.status(500).json({ error: 'Failed to mark session incomplete.' });
  }
}

/**
 * 5. Legacy Single-Blob Upload (Backward Compatibility)
 * POST /api/reactions
 */
export async function uploadReaction(req, res) {
  try {
    const { dayNumber, date } = req.body;
    const file = req.file;

    if (!dayNumber || !date) {
      return res.status(400).json({ error: 'dayNumber and date are required.' });
    }

    if (!file) {
      return res.status(400).json({ error: 'No video file provided.' });
    }

    let videoUrl = '';
    let publicId = '';

    if (isCloudinaryConfigured()) {
      try {
        const result = await new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            {
              resource_type: 'video',
              folder: 'romantic_reactions',
              public_id: `reaction_day_${dayNumber}_${Date.now()}`,
            },
            (error, uploadedResult) => {
              if (error) return reject(error);
              resolve(uploadedResult);
            }
          );
          stream.end(file.buffer);
        });

        videoUrl = result.secure_url;
        publicId = result.public_id;
      } catch (cloudErr) {
        console.warn('Cloudinary upload failed, falling back to local storage:', cloudErr.message);
      }
    }

    if (!videoUrl) {
      const ext = file.mimetype.includes('mp4') ? 'mp4' : 'webm';
      const filename = `reaction-day-${dayNumber}-${Date.now()}.${ext}`;
      const filePath = path.join(uploadsDir, filename);
      fs.writeFileSync(filePath, file.buffer);
      videoUrl = `/uploads/${filename}`;
      publicId = filename;
    }

    const sessionId = `legacy_${Date.now()}`;
    const reactionData = {
      sessionId,
      dayNumber: Number(dayNumber),
      date,
      status: 'completed',
      startedAt: new Date(),
      completedAt: new Date(),
      chunksUploaded: 1,
      reactionVideoUrl: videoUrl,
      cloudinaryPublicId: publicId,
    };

    try {
      const savedDoc = await Reaction.findOneAndUpdate(
        { dayNumber: Number(dayNumber) },
        reactionData,
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      return res.status(201).json({
        success: true,
        message: 'Reaction uploaded successfully ❤️',
        reaction: savedDoc,
      });
    } catch (mongoErr) {
      memoryReactions = memoryReactions.filter((r) => r.dayNumber !== Number(dayNumber));
      memoryReactions.push(reactionData);

      return res.status(201).json({
        success: true,
        message: 'Reaction uploaded successfully (cached) ❤️',
        reaction: reactionData,
      });
    }
  } catch (error) {
    console.error('Upload reaction error:', error);
    return res.status(500).json({ error: 'Failed to process reaction upload.' });
  }
}

/**
 * 6. Get All Reactions
 * GET /api/reactions
 */
export async function getAllReactions(req, res) {
  try {
    const reactions = await Reaction.find().sort({ dayNumber: 1, createdAt: -1 });

    // Group by dayNumber to return the latest completed (or latest) reaction per day
    const dayMap = {};
    reactions.forEach((r) => {
      const day = r.dayNumber;
      if (!dayMap[day]) {
        dayMap[day] = r;
      } else if (r.status === 'completed' && dayMap[day].status !== 'completed') {
        dayMap[day] = r;
      }
    });

    const reactionList = Object.values(dayMap).sort((a, b) => a.dayNumber - b.dayNumber);

    return res.json({ success: true, reactions: reactionList });
  } catch (error) {
    // If DB is offline, return memory cache
    const dayMap = {};
    memoryReactions.forEach((r) => {
      const day = r.dayNumber;
      if (!dayMap[day]) {
        dayMap[day] = r;
      } else if (r.status === 'completed' && dayMap[day].status !== 'completed') {
        dayMap[day] = r;
      }
    });
    return res.json({ success: true, reactions: Object.values(dayMap) });
  }
}

/**
 * 7. Get Single Reaction by Day
 * GET /api/reactions/:day
 */
export async function getReactionByDay(req, res) {
  try {
    const day = Number(req.params.day);
    // Find completed first, or latest
    let reaction = await Reaction.findOne({ dayNumber: day, status: 'completed' });
    if (!reaction) {
      reaction = await Reaction.findOne({ dayNumber: day }).sort({ createdAt: -1 });
    }

    if (!reaction) {
      const memory = memoryReactions.find((r) => r.dayNumber === day && r.status === 'completed') ||
        memoryReactions.find((r) => r.dayNumber === day);
      if (memory) return res.json({ success: true, reaction: memory });
      return res.status(404).json({ error: 'No reaction found for this day.' });
    }
    return res.json({ success: true, reaction });
  } catch (error) {
    const memory = memoryReactions.find((r) => r.dayNumber === Number(req.params.day));
    if (memory) return res.json({ success: true, reaction: memory });
    return res.status(500).json({ error: 'Could not fetch reaction.' });
  }
}

/**
 * 8. Validate Day Protection
 * GET /api/day/:dayNumber
 */
export async function validateDayAccess(req, res) {
  const day = Number(req.params.dayNumber);
  if (isNaN(day) || day < 1 || day > 18) {
    return res.status(400).json({ error: 'Invalid day number.' });
  }

  const todayInKolkata = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());

  const targetDateStr = `2026-10-${day < 10 ? '0' + day : day}`;
  const isUnlocked = todayInKolkata >= targetDateStr;

  return res.json({
    day,
    targetDate: targetDateStr,
    currentKolkataDate: todayInKolkata,
    isUnlocked,
    status: todayInKolkata < targetDateStr ? 'LOCKED' : todayInKolkata === targetDateStr ? 'AVAILABLE' : 'COMPLETED',
  });
}
