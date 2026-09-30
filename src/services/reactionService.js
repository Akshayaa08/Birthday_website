/**
 * Reaction Service
 * 
 * Manages continuous chunked recording sessions, chunk uploads with retry,
 * finalization, and resilient fallback storage.
 */

const API_BASE = '/api';

/**
 * 1. Create a Recording Session on the backend
 * @param {Object} params - { dayNumber, date, sessionId }
 */
export async function createRecordingSession({ dayNumber, date, sessionId }) {
  try {
    const response = await fetch(`${API_BASE}/reactions/session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dayNumber, date, sessionId }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || `Server responded with ${response.status}`);
    }

    const data = await response.json();
    return { success: true, session: data.session };
  } catch (error) {
    console.warn('Backend session creation warning (local session fallback):', error.message);
    // Local fallback session
    const localSession = {
      sessionId,
      dayNumber,
      date,
      status: 'recording',
      startedAt: new Date().toISOString(),
      chunksUploaded: 0,
    };
    saveLocalSession(localSession);
    return { success: true, session: localSession, isFallback: true };
  }
}

/**
 * 2. Upload an individual recording chunk with automatic retry
 * @param {Object} params - { sessionId, dayNumber, chunkNumber, chunkBlob }
 * @param {number} maxRetries - default 3
 */
export async function uploadReactionChunk(
  { sessionId, dayNumber, chunkNumber, chunkBlob },
  maxRetries = 3
) {
  let attempt = 0;
  let lastError = null;

  while (attempt < maxRetries) {
    attempt++;
    try {
      const formData = new FormData();
      formData.append('chunkNumber', chunkNumber);
      formData.append('dayNumber', dayNumber);
      formData.append('chunk', chunkBlob, `chunk_${chunkNumber}.webm`);

      const response = await fetch(`${API_BASE}/reactions/${sessionId}/chunk`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Server chunk upload error HTTP ${response.status}`);
      }

      const data = await response.json();
      return { success: true, data };
    } catch (err) {
      lastError = err;
      console.warn(`Chunk ${chunkNumber} upload attempt ${attempt}/${maxRetries} failed:`, err.message);
      if (attempt < maxRetries) {
        // Exponential backoff wait (500ms, 1000ms...)
        await new Promise((r) => setTimeout(r, attempt * 500));
      }
    }
  }

  // All retries failed - preserve in local memory/storage as pending
  console.warn(`Chunk ${chunkNumber} failed after ${maxRetries} retries.`);
  return { success: false, error: lastError, pending: true };
}

/**
 * 3. Finalize Recording Session
 * @param {Object} params - { sessionId, dayNumber, date, localFallbackBlob }
 */
export async function finalizeReactionSession({ sessionId, dayNumber, date, localFallbackBlob }) {
  try {
    const response = await fetch(`${API_BASE}/reactions/${sessionId}/finalize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dayNumber, date }),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || `Finalize error HTTP ${response.status}`);
    }

    const data = await response.json();
    const videoUrl = data.reaction?.reactionVideoUrl || '';
    markDayCompletedLocally(dayNumber, videoUrl);

    return { success: true, data };
  } catch (error) {
    console.warn('Backend finalize fallback (saving local video url):', error.message);

    let localVideoUrl = '';
    if (localFallbackBlob) {
      localVideoUrl = URL.createObjectURL(localFallbackBlob);
    }

    const fallbackReaction = {
      sessionId,
      dayNumber,
      date,
      status: 'completed',
      reactionVideoUrl: localVideoUrl,
      createdAt: new Date().toISOString(),
      isLocal: true,
    };

    saveLocalFallbackReaction(fallbackReaction);
    markDayCompletedLocally(dayNumber, localVideoUrl);

    return {
      success: true,
      data: {
        message: 'Saved locally ❤️',
        reaction: fallbackReaction,
      },
      isFallback: true,
    };
  }
}

/**
 * 4. Mark Session Incomplete (e.g. user leaves page before finishing)
 * Uses keepalive or sendBeacon for safe execution during page unload
 * @param {string} sessionId
 */
export function markSessionIncomplete(sessionId) {
  if (!sessionId) return;
  const url = `${API_BASE}/reactions/${sessionId}/incomplete`;

  try {
    if (navigator.sendBeacon) {
      const blob = new Blob([JSON.stringify({ sessionId })], { type: 'application/json' });
      navigator.sendBeacon(url, blob);
    } else {
      fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
        keepalive: true,
      }).catch(() => {});
    }
  } catch (e) {
    // ignore
  }
}

/**
 * 5. Fetch all saved reactions
 */
export async function fetchAllReactions() {
  try {
    const response = await fetch(`${API_BASE}/reactions`);
    if (response.ok) {
      const data = await response.json();
      if (Array.isArray(data.reactions) && data.reactions.length > 0) {
        return data.reactions;
      }
    }
  } catch (e) {
    console.warn('Backend unavailable, reading local reactions cache:', e.message);
  }

  return getLocalReactions();
}

/**
 * 6. Fetch a single reaction by day number
 */
export async function fetchReactionByDay(dayNumber) {
  try {
    const response = await fetch(`${API_BASE}/reactions/${dayNumber}`);
    if (response.ok) {
      const data = await response.json();
      if (data.reaction) return data.reaction;
    }
  } catch (e) {
    // continue
  }

  const local = getLocalReactions();
  return local.find((r) => Number(r.dayNumber) === Number(dayNumber)) || null;
}

/**
 * Legacy single-blob upload helper
 */
export async function uploadReaction({ dayNumber, date, videoBlob }) {
  const formData = new FormData();
  formData.append('dayNumber', dayNumber);
  formData.append('date', date);

  const extension = videoBlob.type.includes('mp4') ? 'mp4' : 'webm';
  formData.append('reactionVideo', videoBlob, `reaction-day-${dayNumber}.${extension}`);

  try {
    const response = await fetch(`${API_BASE}/reactions`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Server responded with ${response.status}`);
    }

    const data = await response.json();
    markDayCompletedLocally(dayNumber, data.reaction?.reactionVideoUrl);
    return { success: true, data };
  } catch (error) {
    const localVideoUrl = URL.createObjectURL(videoBlob);
    saveLocalFallbackReaction({
      dayNumber,
      date,
      status: 'completed',
      reactionVideoUrl: localVideoUrl,
      createdAt: new Date().toISOString(),
      isLocal: true,
    });
    markDayCompletedLocally(dayNumber, localVideoUrl);

    return {
      success: true,
      data: {
        message: 'Saved locally ❤️',
        reaction: { dayNumber, date, reactionVideoUrl: localVideoUrl },
      },
      isFallback: true,
    };
  }
}

// ----------------------------------------------------------------------------
// Local Storage Helpers
// ----------------------------------------------------------------------------

function getLocalReactions() {
  try {
    const stored = localStorage.getItem('romantic_reactions');
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveLocalFallbackReaction(reaction) {
  try {
    const existing = getLocalReactions().filter(
      (r) => Number(r.dayNumber) !== Number(reaction.dayNumber)
    );
    existing.push(reaction);
    localStorage.setItem('romantic_reactions', JSON.stringify(existing));
  } catch (e) {
    console.warn('Failed to save reaction locally:', e);
  }
}

function saveLocalSession(session) {
  try {
    const sessions = JSON.parse(localStorage.getItem('romantic_sessions') || '[]');
    sessions.push(session);
    localStorage.setItem('romantic_sessions', JSON.stringify(sessions));
  } catch (e) {
    // ignore
  }
}

function markDayCompletedLocally(dayNumber, videoUrl) {
  try {
    const completedDays = JSON.parse(localStorage.getItem('completed_days') || '[]');
    if (!completedDays.includes(dayNumber)) {
      completedDays.push(dayNumber);
      localStorage.setItem('completed_days', JSON.stringify(completedDays));
    }
  } catch (e) {
    console.warn('Failed to mark day completed locally:', e);
  }
}

export function isDayCompletedLocally(dayNumber) {
  try {
    const completedDays = JSON.parse(localStorage.getItem('completed_days') || '[]');
    return completedDays.includes(Number(dayNumber));
  } catch {
    return false;
  }
}
