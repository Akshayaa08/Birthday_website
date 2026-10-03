import fs from 'fs';
import path from 'path';
import { Readable } from 'stream';
import { pipeline } from 'stream/promises';
import { fileURLToPath } from 'url';
import cloudinary, { isCloudinaryConfigured } from '../config/cloudinary.js';
import Reaction from '../models/Reaction.js';
import JourneyActivity from '../models/JourneyActivity.js';
import { getJourneyDateString, getTodayInKolkata } from '../utils/dateUtils.js';

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

function safeErrorMessage(error) {
  let message = error instanceof Error ? error.message : String(error);
  const sensitiveKeys = [
    'OWNER_PASSWORD',
    'BOYFRIEND_PASSWORD',
    'SESSION_SECRET',
    'CLOUDINARY_API_KEY',
    'CLOUDINARY_API_SECRET',
    'MONGODB_URI',
  ];

  for (const key of sensitiveKeys) {
    const value = process.env[key];
    if (value) message = message.split(value).join('[REDACTED]');
  }

  const mongoUri = process.env.MONGODB_URI;
  if (mongoUri) {
    try {
      const parsedUri = new URL(mongoUri);
      for (const credential of [parsedUri.username, parsedUri.password]) {
        if (credential) {
          message = message.split(decodeURIComponent(credential)).join('[REDACTED]');
        }
      }
    } catch {
      // The URI itself is still removed above when it appears in an error.
    }
  }

  return message.slice(0, 500);
}

function logReactionChunkUploadFailure(req, error) {
  console.error('❌ Reaction chunk upload failed', {
    User: req.user?.userId || 'unknown',
    Day: req.body?.dayNumber || 'unknown',
    Session: req.params?.sessionId || 'unknown',
    Chunk: req.body?.chunkNumber || 'unknown',
    Error: safeErrorMessage(error),
  });
}

export function handleReactionChunkUploadError(error, req, res, next) {
  if (res.headersSent) return next(error);
  logReactionChunkUploadFailure(req, error);

  const statusCode = Number.isInteger(error.statusCode) && error.statusCode >= 400 && error.statusCode < 500
    ? error.statusCode
    : error.name === 'MulterError'
      ? 400
      : 500;
  return res.status(statusCode).json({
    success: false,
    message: 'Reaction chunk upload failed',
  });
}

function streamSessionChunks(chunkFiles, sessionPath) {
  return Readable.from((async function* () {
    for (const file of chunkFiles) {
      const chunkStream = fs.createReadStream(path.join(sessionPath, file));
      for await (const chunk of chunkStream) yield chunk;
    }
  })());
}

async function markReactionActivity(user, dayNumber, sessionId, uploaded = false) {
  await JourneyActivity.findOneAndUpdate(
    { userId: user.userId, dayNumber },
    {
      $set: {
        reactionRecorded: true,
        reactionSessionId: sessionId,
        ...(uploaded ? { reactionUploaded: true } : {}),
      },
      $setOnInsert: {
        userId: user.userId,
        role: 'BOYFRIEND',
        dayNumber,
        date: getJourneyDateString(dayNumber),
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
}

/**
 * 1. Create a Recording Session
 * POST /api/reactions/session
 * Body: { sessionId, dayNumber, date }
 */
export async function createRecordingSession(req, res) {
  try {
    const { sessionId, dayNumber, date } = req.body;

    const parsedDay = Number(dayNumber);
    const canonicalDate = getJourneyDateString(parsedDay);
    if (!sessionId || !Number.isInteger(parsedDay) || parsedDay < 1 || parsedDay > 18 || date !== canonicalDate) {
      return res.status(400).json({ error: 'sessionId, dayNumber, and date are required.' });
    }
    if (!/^[a-zA-Z0-9_-]+$/.test(sessionId)) {
      return res.status(400).json({ error: 'Invalid sessionId.' });
    }
    if (canonicalDate > getTodayInKolkata()) {
      return res.status(403).json({ error: 'This surprise is not available yet.' });
    }

    const existingSession = await Reaction.findOne({ sessionId });
    if (existingSession && existingSession.userId !== req.user.userId) {
      return res.status(409).json({ error: 'Session ID is already in use.' });
    }

    // Ensure session directory exists for storing chunks
    const sessionPath = path.join(sessionsDir, sessionId);
    if (!fs.existsSync(sessionPath)) {
      fs.mkdirSync(sessionPath, { recursive: true });
    }

    const sessionData = {
      sessionId,
      userId: req.user.userId,
      role: 'BOYFRIEND',
      dayNumber: parsedDay,
      date: canonicalDate,
      status: 'recording',
      startedAt: new Date(),
      chunksUploaded: 0,
      reactionVideoUrl: '',
      cloudinaryPublicId: '',
    };

    const doc = await Reaction.findOneAndUpdate(
      { sessionId, userId: req.user.userId },
      sessionData,
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return res.status(201).json({
      success: true,
      message: 'Recording session created ❤️',
      session: doc,
    });
  } catch (err) {
    console.error('Error creating recording session:', safeErrorMessage(err));
    return res.status(500).json({ error: 'Failed to create recording session.' });
  }
}

/**
 * 2. Upload Reaction Chunk
 * POST /api/reactions/:sessionId/chunk
 * FormData: chunk (file), chunkNumber, dayNumber
 */
// export async function uploadReactionChunk(req, res) {
//   try {
//     const { sessionId } = req.params;
//     const { chunkNumber = 0, dayNumber } = req.body;
//     const file = req.file;

//     if (!sessionId) {
//       return res.status(400).json({ error: 'sessionId param is required.' });
//     }

//     if (!file || !file.buffer) {
//       return res.status(400).json({ error: 'No video chunk file provided.' });
//     }

//     // Write chunk directly to disk
//     const sessionPath = path.join(sessionsDir, sessionId);
//     if (!fs.existsSync(sessionPath)) {
//       fs.mkdirSync(sessionPath, { recursive: true });
//     }

//     const chunkFileName = `chunk_${String(chunkNumber).padStart(6, '0')}.webm`;
//     const chunkFilePath = path.join(sessionPath, chunkFileName);
//     fs.writeFileSync(chunkFilePath, file.buffer);

//     const chunkIndex = Number(chunkNumber);

//     // Update MongoDB document
//     try {
//       const updatedDoc = await Reaction.findOneAndUpdate(
//         { sessionId },
//         {
//           $inc: { chunksUploaded: 1 },
//           $setOnInsert: {
//             sessionId,
//             dayNumber: dayNumber ? Number(dayNumber) : 1,
//             status: 'recording',
//             startedAt: new Date(),
//           },
//         },
//         { upsert: true, new: true }
//       );

//       return res.status(200).json({
//         success: true,
//         sessionId,
//         chunkNumber: chunkIndex,
//         chunksUploaded: updatedDoc.chunksUploaded,
//       });
//     } catch (dbErr) {
//       // Memory fallback
//       const found = memoryReactions.find((r) => r.sessionId === sessionId);
//       if (found) {
//         found.chunksUploaded = (found.chunksUploaded || 0) + 1;
//       }
//       return res.status(200).json({
//         success: true,
//         sessionId,
//         chunkNumber: chunkIndex,
//         chunksUploaded: found ? found.chunksUploaded : chunkIndex + 1,
//       });
//     }
//   } catch (err) {
//     console.error('Error saving reaction chunk:', err);
//     return res.status(500).json({ error: 'Failed to save reaction chunk.' });
//   }
// }
export async function uploadReactionChunk(req, res) {
  try {
    const { sessionId } = req.params;
    const { chunkNumber = 0, dayNumber } = req.body;
    const file = req.file;

    console.log('📥 CHUNK UPLOAD REQUEST');

    console.log({
      sessionId,
      chunkNumber,
      dayNumber,
      hasFile: !!file,
      fileSize: file?.size,
      fileName: file?.originalname,
      mimeType: file?.mimetype,
    });

    if (!sessionId) {
      return res.status(400).json({
        success: false,
        error: 'sessionId param is required.',
      });
    }

    const session = await Reaction.findOne({ sessionId, userId: req.user.userId, status: 'recording' });
    if (!session) return res.status(404).json({ success: false, error: 'Recording session not found.' });
    if (Number(dayNumber) !== session.dayNumber) return res.status(400).json({ success: false, error: 'Day number does not match its recording session.' });

    if (!file) {
      return res.status(400).json({
        success: false,
        error: 'No chunk received from browser.',
      });
    }

    if (!file.buffer || file.buffer.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Received video chunk is empty.',
      });
    }

    const chunkIndex = Number(chunkNumber);

    if (!Number.isInteger(chunkIndex) || chunkIndex < 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid chunkNumber.',
      });
    }

    /*
     * Prevent unsafe session IDs from creating
     * unexpected filesystem paths.
     */
    if (!/^[a-zA-Z0-9_-]+$/.test(sessionId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid sessionId.',
      });
    }

    /*
     * Create session directory.
     */
    const sessionPath = path.join(
      sessionsDir,
      sessionId
    );

    fs.mkdirSync(sessionPath, {
      recursive: true,
    });

    /*
     * IMPORTANT:
     * Do not blindly increment chunksUploaded.
     *
     * If the browser retries chunk 3,
     * chunk 3 should still count as ONE chunk.
     */
    const chunkFileName =
      `chunk_${String(chunkIndex).padStart(6, '0')}.webm`;

    const chunkFilePath = path.join(
      sessionPath,
      chunkFileName
    );

    /*
     * Save chunk.
     */
    fs.writeFileSync(
      chunkFilePath,
      file.buffer
    );

    console.log(
      `✅ Chunk ${chunkIndex} saved:`,
      chunkFilePath
    );

    /*
     * Count actual chunks on disk.
     */
    const savedChunkFiles = fs
      .readdirSync(sessionPath)
      .filter((name) =>
        /^chunk_\d+\.webm$/.test(name)
      );

    const actualChunkCount =
      savedChunkFiles.length;

    /*
     * Update MongoDB.
     */
    try {
      const updatedDoc =
        await Reaction.findOneAndUpdate(
          { sessionId, userId: req.user.userId },

          {
            $set: {
              chunksUploaded:
                actualChunkCount,
            },

          },

          {
            new: true,
          }
        );

      if (!updatedDoc) {
        return res.status(404).json({ success: false, error: 'Recording session not found.' });
      }
      await markReactionActivity(req.user, updatedDoc.dayNumber, sessionId);

      console.log(
        `✅ MongoDB updated. chunksUploaded=${actualChunkCount}`
      );

      return res.status(200).json({
        success: true,
        sessionId,
        chunkNumber: chunkIndex,
        chunksUploaded:
          updatedDoc.chunksUploaded,
      });
    } catch (dbErr) {
      logReactionChunkUploadFailure(req, dbErr);
      return res.status(500).json({
        success: false,
        message: 'Reaction chunk upload failed',
      });
    }
  } catch (err) {
    logReactionChunkUploadFailure(req, err);
    return res.status(500).json({
      success: false,
      message: 'Reaction chunk upload failed',
    });
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

    if (!sessionId || !/^[a-zA-Z0-9_-]+$/.test(sessionId)) {
      return res.status(400).json({ error: 'sessionId param is required.' });
    }

    const session = await Reaction.findOne({ sessionId, userId: req.user.userId });
    if (!session) return res.status(404).json({ error: 'Recording session not found.' });
    if (Number(dayNumber) !== session.dayNumber || date !== session.date) {
      return res.status(400).json({ error: 'Recording metadata does not match its session.' });
    }
    if (session.status === 'completed') {
      await markReactionActivity(req.user, session.dayNumber, sessionId, true);
      return res.json({
        success: true,
        message: 'Reaction recording is already finalized.',
        reaction: { ...session.toObject(), reactionVideoUrl: '' },
      });
    }
    if (session.status !== 'recording') {
      return res.status(409).json({ error: 'This recording session is incomplete and cannot be finalized.' });
    }

    const sessionPath = path.join(sessionsDir, sessionId);

    // Gather all chunks for this session
    let chunkFiles = [];
    if (fs.existsSync(sessionPath)) {
      chunkFiles = fs.readdirSync(sessionPath)
        .filter((file) => /^chunk_\d+\.webm$/.test(file))
        .sort();
    }

    if (chunkFiles.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No video chunks were uploaded. The recording could not be finalized.',
        sessionId,
        chunksFound: 0,
      });
    }

    let publicId = '';
    let localFileName = '';
    let storageType = 'local';
    if (isCloudinaryConfigured()) {
      try {
        const uploadResult = await new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            {
              resource_type: 'video',
              type: 'authenticated',
              folder: 'romantic_reactions',
              public_id: `reaction_day_${session.dayNumber}_${sessionId}`,
            },
            (error, uploaded) => {
              if (error) return reject(error);
              resolve(uploaded);
            }
          );
          const source = streamSessionChunks(chunkFiles, sessionPath);
          source.on('error', reject);
          stream.on('error', reject);
          source.pipe(stream);
        });

        if (!uploadResult?.public_id) throw new Error('Cloudinary returned no asset ID.');
        publicId = uploadResult.public_id;
        session.videoFormat = uploadResult.format || 'webm';
        storageType = 'cloudinary';
      } catch (cloudErr) {
        await Reaction.updateOne(
          { sessionId, userId: req.user.userId, status: 'recording' },
          { $set: { status: 'incomplete' } }
        );
        console.error('Cloudinary reaction upload failed:', safeErrorMessage(cloudErr));
        return res.status(502).json({ error: 'Reaction chunks are saved, but Cloudinary could not finalize the recording.' });
      }
    }

    if (storageType === 'local') {
      localFileName = `reaction-day-${session.dayNumber}-${sessionId}.webm`;
      await pipeline(
        streamSessionChunks(chunkFiles, sessionPath),
        fs.createWriteStream(path.join(uploadsDir, localFileName))
      );
      publicId = localFileName;
      session.videoFormat = 'webm';
    }

    // Update session record in MongoDB
    const updateData = {
      status: 'completed',
      completedAt: new Date(),
      reactionVideoUrl: '',
      cloudinaryPublicId: publicId,
      storageType,
      localFileName,
      videoFormat: session.videoFormat || 'webm',
    };
    if (dayNumber) updateData.dayNumber = Number(dayNumber);
    if (date) updateData.date = date;

    try {
      const finalizedDoc = await Reaction.findOneAndUpdate(
        { sessionId, userId: req.user.userId },
        updateData,
        { new: true }
      );
      if (!finalizedDoc) return res.status(404).json({ error: 'Recording session not found.' });
      await markReactionActivity(req.user, session.dayNumber, sessionId, true);

      return res.status(200).json({
        success: true,
        message: 'Reaction recording finalized and saved ❤️',
        reaction: { ...finalizedDoc.toObject(), reactionVideoUrl: '' },
      });
    } catch (dbErr) {
      console.error('Could not persist finalized reaction:', safeErrorMessage(dbErr));
      return res.status(500).json({ error: 'Reaction was stored but could not be recorded in MongoDB.' });
    }
  } catch (err) {
    console.error('Error finalizing reaction session:', safeErrorMessage(err));
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
        { sessionId, userId: req.user.userId, status: 'recording' },
        { status: 'incomplete' },
        { new: true }
      );
      return res.status(200).json({
        success: true,
        message: 'Session marked as incomplete, chunks preserved.',
        session: updatedDoc,
      });
    } catch (dbErr) {
      return res.status(500).json({ error: 'Could not update the recording session.' });
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
    const parsedDay = Number(dayNumber);
    const canonicalDate = getJourneyDateString(parsedDay);

    if (!Number.isInteger(parsedDay) || parsedDay < 1 || parsedDay > 18 || date !== canonicalDate) {
      return res.status(400).json({ error: 'dayNumber and date are required.' });
    }
    if (canonicalDate > getTodayInKolkata()) {
      return res.status(403).json({ error: 'This surprise is not available yet.' });
    }

    if (!file) {
      return res.status(400).json({ error: 'No video file provided.' });
    }

    let publicId = '';

    if (isCloudinaryConfigured()) {
      try {
        const result = await new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            {
              resource_type: 'video',
              type: 'authenticated',
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

        publicId = result.public_id;
      } catch (cloudErr) {
        console.warn('Cloudinary upload failed, falling back to local storage:', safeErrorMessage(cloudErr));
      }
    }

    let localFileName = '';
    let storageType = 'cloudinary';
    if (!publicId) {
      const ext = file.mimetype.includes('mp4') ? 'mp4' : 'webm';
      const filename = `reaction-day-${dayNumber}-${Date.now()}.${ext}`;
      const filePath = path.join(uploadsDir, filename);
      fs.writeFileSync(filePath, file.buffer);
      localFileName = filename;
      publicId = filename;
      storageType = 'local';
    }

    const sessionId = `legacy_${Date.now()}`;
    const reactionData = {
      sessionId,
      userId: req.user.userId,
      role: 'BOYFRIEND',
      dayNumber: parsedDay,
      date: canonicalDate,
      status: 'completed',
      startedAt: new Date(),
      completedAt: new Date(),
      chunksUploaded: 1,
      reactionVideoUrl: '',
      cloudinaryPublicId: publicId,
      storageType,
      localFileName,
      videoFormat: file.mimetype.includes('mp4') ? 'mp4' : 'webm',
    };

    try {
      const savedDoc = await Reaction.findOneAndUpdate(
        { dayNumber: parsedDay, userId: req.user.userId },
        reactionData,
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      await markReactionActivity(req.user, parsedDay, sessionId, true);
      return res.status(201).json({
        success: true,
        message: 'Reaction uploaded successfully ❤️',
        reaction: savedDoc,
      });
    } catch (mongoErr) {
      console.error('Could not persist legacy reaction in MongoDB:', safeErrorMessage(mongoErr));
      return res.status(500).json({ error: 'Reaction upload could not be saved in MongoDB.' });
    }
  } catch (error) {
    console.error('Upload reaction error:', safeErrorMessage(error));
    return res.status(500).json({ error: 'Failed to process reaction upload.' });
  }
}

/**
 * 6. Get All Reactions
 * GET /api/reactions
 */
export async function getAllReactions(req, res) {
  try {
    const reactions = await Reaction.find({ role: 'BOYFRIEND' }).sort({ dayNumber: 1, createdAt: -1 });

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

    return res.json({ success: true, reactions: reactionList.map((reaction) => ({ ...reaction.toObject(), reactionVideoUrl: '' })) });
  } catch (error) {
    console.error('Could not load reactions from MongoDB:', safeErrorMessage(error));
    return res.status(500).json({ error: 'Could not load reactions.' });
  }
}

/**
 * 7. Get Single Reaction by Day
 * GET /api/reactions/:day
 */
export async function getReactionByDay(req, res) {
  try {
    const day = Number(req.params.day);
    if (!Number.isInteger(day) || day < 1 || day > 18) {
      return res.status(400).json({ error: 'Invalid journey day.' });
    }
    // Find completed first, or latest
    let reaction = await Reaction.findOne({ dayNumber: day, role: 'BOYFRIEND', status: 'completed' });
    if (!reaction) {
      reaction = await Reaction.findOne({ dayNumber: day, role: 'BOYFRIEND' }).sort({ createdAt: -1 });
    }

    if (!reaction) return res.status(404).json({ error: 'No reaction found for this day.' });
    return res.json({ success: true, reaction: { ...reaction.toObject(), reactionVideoUrl: '' } });
  } catch (error) {
    console.error('Could not fetch reaction from MongoDB:', safeErrorMessage(error));
    return res.status(500).json({ error: 'Could not fetch reaction.' });
  }
}

export async function getReactionVideo(req, res) {
  try {
    const reaction = await Reaction.findOne({
      sessionId: req.params.sessionId,
      role: 'BOYFRIEND',
      status: 'completed',
    });
    if (!reaction) return res.status(404).json({ error: 'Reaction video not found.' });

    res.set('Cache-Control', 'private, no-store');
    res.set('Vary', 'Cookie');

    if (reaction.storageType === 'cloudinary' && reaction.cloudinaryPublicId && isCloudinaryConfigured()) {
      const signedUrl = cloudinary.utils.private_download_url(
        reaction.cloudinaryPublicId,
        reaction.videoFormat || 'webm',
        {
          resource_type: 'video',
          type: 'authenticated',
          expires_at: Math.floor(Date.now() / 1000) + 300,
        }
      );
      const upstream = await fetch(signedUrl, {
        headers: req.headers.range ? { Range: req.headers.range } : {},
      });
      if (!upstream.ok && upstream.status !== 206) {
        return res.status(502).json({ error: 'Could not load reaction video from private storage.' });
      }
      for (const header of ['content-type', 'content-length', 'content-range', 'accept-ranges']) {
        const value = upstream.headers.get(header);
        if (value) res.set(header, value);
      }
      res.status(upstream.status);
      return Readable.fromWeb(upstream.body).pipe(res);
    }

    const safeFileName = path.basename(reaction.localFileName || '');
    if (!safeFileName || safeFileName !== reaction.localFileName) {
      return res.status(404).json({ error: 'Reaction video is unavailable.' });
    }
    return res.sendFile(path.join(uploadsDir, safeFileName), {
      headers: { 'Cache-Control': 'private, no-store', Vary: 'Cookie' },
    });
  } catch (error) {
    console.error('Could not serve private reaction video:', safeErrorMessage(error));
    return res.status(500).json({ error: 'Could not load reaction video.' });
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

  const todayInKolkata = getTodayInKolkata();

  const targetDateStr = getJourneyDateString(day);
  const isUnlocked = todayInKolkata >= targetDateStr;

  return res.json({
    day,
    targetDate: targetDateStr,
    currentKolkataDate: todayInKolkata,
    isUnlocked,
    status: todayInKolkata < targetDateStr ? 'LOCKED' : todayInKolkata === targetDateStr ? 'AVAILABLE' : 'COMPLETED',
  });
}
