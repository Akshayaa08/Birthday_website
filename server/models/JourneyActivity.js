import mongoose from 'mongoose';

const journeyActivitySchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true },
    role: { type: String, enum: ['BOYFRIEND'], required: true },
    dayNumber: { type: Number, required: true, min: 1, max: 18 },
    date: { type: String, required: true },
    videoSeen: { type: Boolean, default: false },
    seenAt: { type: Date },
    status: { type: String, enum: ['NOT_SEEN', 'SEEN', 'WATCHING', 'COMPLETED'], default: 'NOT_SEEN' },
    watchingAt: { type: Date },
    videoCompleted: { type: Boolean, default: false },
    completed: { type: Boolean, default: false },
    completedAt: { type: Date },
    reactionRecorded: { type: Boolean, default: false },
    reactionUploaded: { type: Boolean, default: false },
    reactionSessionId: { type: String, default: '' },
  },
  { timestamps: true }
);

journeyActivitySchema.index({ userId: 1, dayNumber: 1 }, { unique: true });

const JourneyActivity = mongoose.models.JourneyActivity || mongoose.model('JourneyActivity', journeyActivitySchema);

export default JourneyActivity;
