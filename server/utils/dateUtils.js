export function formatDateInTimeZone(date, timeZone = 'Asia/Kolkata') {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return `${values.year}-${values.month}-${values.day}`;
}

export function getTodayInKolkata(date = new Date()) {
  return formatDateInTimeZone(date, 'Asia/Kolkata');
}

export function getJourneyDateString(dayNumber) {
  return `2026-10-${String(dayNumber).padStart(2, '0')}`;
}
