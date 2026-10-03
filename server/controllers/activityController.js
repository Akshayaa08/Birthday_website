import JourneyActivity from '../models/JourneyActivity.js';
import Reaction from '../models/Reaction.js';
import { getJourneyDateString, getTodayInKolkata } from '../utils/dateUtils.js';

function validateDay(dayNumber, res) {
  if (!Number.isInteger(dayNumber) || dayNumber < 1 || dayNumber > 18) {
    res.status(400).json({ error: 'Invalid journey day.' });
    return false;
  }
  if (getJourneyDateString(dayNumber) > getTodayInKolkata()) {
    res.status(403).json({ error: 'This surprise is not available yet.' });
    return false;
  }
  return true;
}

async function getOrCreateActivity(user, dayNumber) {
  return JourneyActivity.findOneAndUpdate(
    { userId: user.userId, dayNumber },
    {
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

export async function recordVideoSeen(req, res) {
  const dayNumber = Number(req.params.dayNumber);
  if (!validateDay(dayNumber, res)) return;

  try {
    const activity = await getOrCreateActivity(req.user, dayNumber);
    const now = new Date();
    activity.videoSeen = true;
    activity.seenAt ||= now;
    if (!activity.videoCompleted && !activity.completed) activity.status = 'SEEN';
    await activity.save();
    return res.json({ success: true, activity });
  } catch (error) {
    console.error('Could not persist video seen event:', error.message);
    return res.status(500).json({ error: 'Could not save viewing activity.' });
  }
}

export async function recordVideoWatching(req, res) {
  const dayNumber = Number(req.params.dayNumber);
  if (!validateDay(dayNumber, res)) return;

  try {
    const activity = await getOrCreateActivity(req.user, dayNumber);
    const now = new Date();
    activity.videoSeen = true;
    activity.seenAt ||= now;
    activity.watchingAt ||= now;
    if (!activity.videoCompleted && !activity.completed) activity.status = 'WATCHING';
    await activity.save();
    return res.json({ success: true, activity });
  } catch (error) {
    console.error('Could not persist video watching event:', error.message);
    return res.status(500).json({ error: 'Could not save viewing activity.' });
  }
}

export async function recordVideoCompleted(req, res) {
  const dayNumber = Number(req.params.dayNumber);
  if (!validateDay(dayNumber, res)) return;

  try {
    const activity = await JourneyActivity.findOne({ userId: req.user.userId, dayNumber });
    if (!activity?.videoSeen || !activity.watchingAt) {
      return res.status(409).json({ error: 'The video must start playing before it can be completed.' });
    }
    const now = new Date();
    activity.videoCompleted = true;
    activity.completed = true;
    activity.status = 'COMPLETED';
    activity.completedAt ||= now;
    await activity.save();
    return res.json({ success: true, activity });
  } catch (error) {
    console.error('Could not persist video completion event:', error.message);
    return res.status(500).json({ error: 'Could not save viewing activity.' });
  }
}

export async function getJourneyActivity(req, res) {
  try {
    const [activities, reactions] = await Promise.all([
      JourneyActivity.find({ role: 'BOYFRIEND' }).sort({ dayNumber: 1 }).lean(),
      Reaction.find({ role: 'BOYFRIEND' }).sort({ dayNumber: 1, createdAt: -1 }).lean(),
    ]);

    const latestReactionByDay = new Map();
    for (const reaction of reactions) {
      if (!latestReactionByDay.has(reaction.dayNumber)) {
        latestReactionByDay.set(reaction.dayNumber, reaction);
      }
    }

    const activityByDay = new Map(activities.map((item) => [item.dayNumber, item]));
    const days = Array.from({ length: 18 }, (_, index) => {
      const dayNumber = index + 1;
      const activity = activityByDay.get(dayNumber);
      const reaction = latestReactionByDay.get(dayNumber);
      return {
        dayNumber,
        date: getJourneyDateString(dayNumber),
        videoSeen: Boolean(activity?.videoSeen),
        seenAt: activity?.seenAt || null,
        videoCompleted: Boolean(activity?.videoCompleted || activity?.completed),
        completedAt: activity?.completedAt || null,
        reactionRecorded: Boolean(activity?.reactionRecorded || (reaction && (reaction.chunksUploaded > 0 || reaction.status === 'completed'))),
        reactionUploaded: Boolean(activity?.reactionUploaded || reaction?.status === 'completed'),
        reactionStatus: reaction?.status || null,
        status: activity?.status || (activity?.videoCompleted || activity?.completed ? 'COMPLETED' : activity?.videoSeen ? 'SEEN' : 'NOT_SEEN'),
      };
    });

    return res.json({ success: true, days });
  } catch (error) {
    console.error('Could not load owner activity:', error.message);
    return res.status(500).json({ error: 'Could not load journey activity.' });
  }
}
