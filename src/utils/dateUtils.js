import { config } from '../data/config';

/**
 * Returns today's date formatted as "YYYY-MM-DD" in the specified timezone
 * Respects devMode and testDate if enabled.
 */
export function getTodayDateString(timeZone = config.timezone) {
  if (config.devMode && config.testDate) {
    return config.testDate;
  }

  try {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
    return formatter.format(new Date());
  } catch (err) {
    // Fallback if timezone not supported
    const d = new Date();
    return d.toISOString().split('T')[0];
  }
}

/**
 * Returns current Date object in timezone (or simulated if devMode is on)
 */
export function getCurrentDateTime(timeZone = config.timezone) {
  if (config.devMode && config.testDate) {
    // Create Date at 00:00:00 of the test date in local time
    const [year, month, day] = config.testDate.split('-').map(Number);
    return new Date(year, month - 1, day, 12, 0, 0);
  }
  return new Date();
}

/**
 * Determines day status:
 * today < surpriseDate   -> 'LOCKED'
 * today === surpriseDate  -> 'AVAILABLE'
 * today > surpriseDate   -> 'COMPLETED'
 */
export function getDayStatus(surpriseDateStr) {
  const today = getTodayDateString();

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
export function isJourneyStarted() {
  const today = getTodayDateString();
  return today >= config.journeyStart;
}

/**
 * Check if today is the grand birthday (October 19) or past it
 */
export function isBirthdayAvailable() {
  const today = getTodayDateString();
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
export function calculateTimeRemaining(targetDateStr = config.birthday) {
  let now = new Date();
  if (config.devMode && config.testDate) {
    now = getCurrentDateTime();
  }

  // Target midnight (00:00:00) in Asia/Kolkata (+05:30)
  const targetIso = `${targetDateStr}T00:00:00+05:30`;
  const targetTime = new Date(targetIso).getTime();
  const nowTime = now.getTime();

  const diffMs = targetTime - nowTime;

  if (diffMs <= 0) {
    return {
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      isExpired: true,
      totalMs: 0
    };
  }

  const seconds = Math.floor((diffMs / 1000) % 60);
  const minutes = Math.floor((diffMs / (1000 * 60)) % 60);
  const hours = Math.floor((diffMs / (1000 * 60 * 60)) % 24);
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  return {
    days,
    hours,
    minutes,
    seconds,
    isExpired: false,
    totalMs: diffMs
  };
}
