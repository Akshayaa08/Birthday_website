import { config } from '../data/config.js';

/**
 * Returns today's date formatted as "YYYY-MM-DD" in the specified timezone.
 */
export function getTodayDateString(timeZone = config.timezone, dateOverride = '') {
  if (/^2026-10-(0[1-9]|1[0-9])$/.test(dateOverride)) return dateOverride;
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(new Date(Date.now()));
  const dateParts = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return `${dateParts.year}-${dateParts.month}-${dateParts.day}`;
}

/**
 * Determines day status:
 * today < surpriseDate   -> 'LOCKED'
 * today === surpriseDate  -> 'AVAILABLE'
 * today > surpriseDate   -> 'COMPLETED'
 */
export function getDayStatus(surpriseDateStr, dateOverride = '') {
  const today = getTodayDateString(config.timezone, dateOverride);

  if (today < surpriseDateStr) {
    return 'LOCKED';
  } else if (today === surpriseDateStr) {
    return 'AVAILABLE';
  } else {
    return 'COMPLETED';
  }
}

/**
 * Check if the entire 19-day journey has begun
 */
export function isJourneyStarted(dateOverride = '') {
  const today = getTodayDateString(config.timezone, dateOverride);
  return today >= config.journeyStart;
}

/**
 * Check if today is the grand birthday (October 19) or past it
 */
export function isBirthdayAvailable(dateOverride = '') {
  const today = getTodayDateString(config.timezone, dateOverride);
  return today >= config.birthday;
}

/**
 * Formats date string "YYYY-MM-DD" to human readable format
 * e.g., "October 1, 2026" or "Oct 01"
 */
export function formatReadableDate(dateStr, short = false) {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);

  if (short) {
    return date.toLocaleDateString('en-US', { month: 'short', day: '2-digit' });
  }

  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });
}

/**
 * Calculate countdown remaining time until a target date at midnight (00:00:00) in timezone
 */
export function calculateTimeRemaining(targetDateStr = config.birthday, dateOverride = '') {
  // Target midnight (00:00:00) in Asia/Kolkata (+05:30)
  const targetIso = `${targetDateStr}T00:00:00+05:30`;
  const targetTime = new Date(targetIso).getTime();
  const now = /^2026-10-(0[1-9]|1[0-9])$/.test(dateOverride)
    ? new Date(`${dateOverride}T12:00:00+05:30`).getTime()
    : Date.now();
  const totalSeconds = Math.floor((targetTime - now) / 1000);

  if (totalSeconds <= 0) {
    return {
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      isExpired: true,
      totalMs: 0
    };
  }

  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return {
    days,
    hours,
    minutes,
    seconds,
    isExpired: false,
    totalMs: totalSeconds * 1000
  };
}
