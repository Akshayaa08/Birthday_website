/**
 * Reaction Service
 * 
 * Manages continuous chunked recording sessions, chunk uploads with retry,
 * and server-side finalization.
 */

import { API_BASE } from './api';
/**
 * 1. Create a Recording Session on the backend
 * @param {Object} params - { dayNumber, date, sessionId }
 */
export async function createRecordingSession({ dayNumber, date, sessionId }) {
  try {
    const response = await fetch(`${API_BASE}/api/reactions/session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dayNumber, date, sessionId }),
      credentials: 'include',
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || `Server responded with ${response.status}`);
    }

    const data = await response.json();
    return { success: true, session: data.session };
  } catch (error) {
    console.error('Backend session creation failed:', error.message);
    return { success: false, error };
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

      const response = await fetch(`${API_BASE}/api/reactions/${encodeURIComponent(sessionId)}/chunk`, {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Reaction chunk upload failed (HTTP ${response.status}).`);
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

  // The caller will stop playback from being treated as a successfully saved reaction.
  console.warn(`Chunk ${chunkNumber} failed after ${maxRetries} retries.`);
  return { success: false, error: lastError, pending: false };
}

/**
 * 3. Finalize Recording Session
 * @param {Object} params - { sessionId, dayNumber, date }
 */
export async function finalizeReactionSession({ sessionId, dayNumber, date }) {
  try {
    const response = await fetch(`${API_BASE}/api/reactions/${encodeURIComponent(sessionId)}/finalize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dayNumber, date }),
      credentials: 'include',
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || `Finalize error HTTP ${response.status}`);
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    console.error('Backend reaction finalization failed:', error.message);
    return { success: false, error };
  }
}

/**
 * 4. Mark Session Incomplete (e.g. user leaves page before finishing)
 * Uses keepalive or sendBeacon for safe execution during page unload
 * @param {string} sessionId
 */
export function markSessionIncomplete(sessionId) {
  if (!sessionId) return;
  const url = `${API_BASE}/api/reactions/${encodeURIComponent(sessionId)}/incomplete`;

  fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      keepalive: true,
      credentials: 'include',
    }).catch((error) => console.error('Could not mark reaction recording incomplete:', error.message));
}

/**
 * 5. Fetch all saved reactions
 */
export async function fetchAllReactions() {
  try {
    const response = await fetch(`${API_BASE}/api/reactions`, { credentials: 'include' });
    if (!response.ok) throw new Error(`Could not load reactions (HTTP ${response.status}).`);
    const data = await response.json();
    return Array.isArray(data.reactions) ? data.reactions : [];
  } catch (e) {
    console.warn('Could not load owner reactions:', e.message);
    throw e;
  }
}

/**
 * 6. Fetch a single reaction by day number
 */
export async function fetchReactionByDay(dayNumber) {
  const response = await fetch(`${API_BASE}/api/reactions/${dayNumber}`, { credentials: 'include' });
  if (!response.ok) throw new Error(`Could not load reaction (HTTP ${response.status}).`);
  const data = await response.json();
  return data.reaction || null;
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
    const response = await fetch(`${API_BASE}/api/reactions`, {
      method: 'POST',
      body: formData,
      credentials: 'include',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Server responded with ${response.status}`);
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    console.error('Backend reaction upload failed:', error.message);
    return { success: false, error };
  }
}
