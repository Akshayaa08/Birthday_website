import { apiFetch } from './api';

export function recordVideoSeen(dayNumber) {
  return apiFetch(`/api/journey/${dayNumber}/seen`, { method: 'POST' });
}

export function recordVideoWatching(dayNumber) {
  return apiFetch(`/api/journey/${dayNumber}/watching`, { method: 'POST' });
}

export function recordVideoCompleted(dayNumber) {
  return apiFetch(`/api/journey/${dayNumber}/completed`, { method: 'POST' });
}

export function fetchJourneyActivity() {
  return apiFetch('/api/admin/activity');
}
