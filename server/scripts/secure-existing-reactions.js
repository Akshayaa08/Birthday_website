import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import cloudinary, { isCloudinaryConfigured } from '../config/cloudinary.js';
import { connectDB } from '../config/db.js';
import Reaction from '../models/Reaction.js';
import JourneyActivity from '../models/JourneyActivity.js';
import { getJourneyDateString } from '../utils/dateUtils.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDirectory = path.resolve(__dirname, '../../uploads');

function uploadPrivateVideo(buffer, publicId) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { resource_type: 'video', type: 'authenticated', folder: 'romantic_reactions', public_id: publicId },
      (error, result) => error ? reject(error) : resolve(result)
    );
    stream.end(buffer);
  });
}

async function migrate() {
  await connectDB();
  const reactions = await Reaction.find({});
  let migrated = 0;

  for (const reaction of reactions) {
    const updates = {
      userId: 'boyfriend',
      role: 'BOYFRIEND',
      reactionVideoUrl: '',
    };
    let legacyCloudPublicId = '';

    if (/^https:\/\/res\.cloudinary\.com\//i.test(reaction.reactionVideoUrl || '')) {
      if (!isCloudinaryConfigured()) throw new Error('Cloudinary credentials are required to secure existing Cloudinary reactions.');
      const previousPublicId = reaction.cloudinaryPublicId;
      if (!previousPublicId) throw new Error(`Reaction ${reaction.sessionId} has a Cloudinary URL but no public ID.`);
      const response = await fetch(reaction.reactionVideoUrl);
      if (!response.ok) throw new Error(`Could not download existing reaction ${reaction.sessionId} (${response.status}).`);
      const upload = await uploadPrivateVideo(
        Buffer.from(await response.arrayBuffer()),
        `${previousPublicId.replace(/[^a-zA-Z0-9_/-]/g, '_')}_private_${Date.now()}`
      );
      updates.cloudinaryPublicId = upload.public_id;
      updates.storageType = 'cloudinary';
      updates.videoFormat = upload.format || reaction.videoFormat || 'webm';
      updates.localFileName = '';
      legacyCloudPublicId = previousPublicId;
    } else {
      const localMatch = (reaction.reactionVideoUrl || '').match(/^\/uploads\/(.+)$/);
      const localFileName = localMatch ? path.basename(decodeURIComponent(localMatch[1])) : reaction.localFileName;
      if (localFileName && localFileName === path.basename(localFileName) && fs.existsSync(path.join(uploadsDirectory, localFileName))) {
        updates.storageType = 'local';
        updates.localFileName = localFileName;
        updates.videoFormat = path.extname(localFileName).slice(1) || 'webm';
      }
    }

    await Reaction.collection.updateOne({ _id: reaction._id }, { $set: updates });
    await JourneyActivity.findOneAndUpdate(
      { userId: 'boyfriend', dayNumber: reaction.dayNumber },
      {
        $set: {
          reactionRecorded: reaction.chunksUploaded > 0 || reaction.status === 'completed',
          reactionUploaded: reaction.status === 'completed',
          reactionSessionId: reaction.sessionId,
        },
        $setOnInsert: {
          userId: 'boyfriend',
          role: 'BOYFRIEND',
          dayNumber: reaction.dayNumber,
          date: reaction.date || getJourneyDateString(reaction.dayNumber),
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    if (legacyCloudPublicId) {
      try {
        await cloudinary.uploader.destroy(legacyCloudPublicId, { resource_type: 'video', type: 'upload', invalidate: true });
      } catch (error) {
        console.warn(`Private replacement saved, but old public asset ${legacyCloudPublicId} could not be invalidated: ${error.message}`);
      }
    }

    migrated += 1;
  }

  console.log(`Secured ${migrated} reaction record(s).`);
}

migrate()
  .catch((error) => {
    console.error('Reaction migration failed:', error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    if (mongoose.connection.readyState) await mongoose.disconnect();
  });
