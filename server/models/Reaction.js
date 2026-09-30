import mongoose from 'mongoose';

const reactionSchema = new mongoose.Schema(
  {
    sessionId: {
      type: String,
      required: true,
      index: true,
    },
    dayNumber: {
      type: Number,
      required: true,
      index: true,
      min: 1,
      max: 18,
    },
    date: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['recording', 'incomplete', 'completed'],
      default: 'recording',
    },
    startedAt: {
      type: Date,
      default: Date.now,
    },
    completedAt: {
      type: Date,
    },
    chunksUploaded: {
      type: Number,
      default: 0,
    },
    reactionVideoUrl: {
      type: String,
      default: '',
    },
    cloudinaryPublicId: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

const Reaction = mongoose.models.Reaction || mongoose.model('Reaction', reactionSchema);

export default Reaction;
