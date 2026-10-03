import assert from 'node:assert/strict';
import { test } from 'node:test';
import { calculateTimeRemaining, getDayStatus, getTodayDateString, isBirthdayAvailable } from './dateUtils.js';
import { getJourneyDateString, getTodayInKolkata } from '../../server/utils/dateUtils.js';

function withNow(isoDate, callback) {
  const originalNow = Date.now;
  Date.now = () => new Date(isoDate).getTime();
  try {
    callback();
  } finally {
    Date.now = originalNow;
  }
}

test('journey dates roll over at midnight in Asia/Kolkata', () => {
  withNow('2026-09-30T18:29:59.000Z', () => {
    assert.equal(getTodayDateString(), '2026-09-30');
    assert.equal(getDayStatus('2026-10-01'), 'LOCKED');
    assert.equal(getDayStatus('2026-10-02'), 'LOCKED');
  });

  withNow('2026-09-30T18:30:00.000Z', () => {
    assert.equal(getTodayDateString(), '2026-10-01');
    assert.equal(getDayStatus('2026-10-01'), 'AVAILABLE');
    assert.equal(getDayStatus('2026-10-02'), 'LOCKED');
  });

  withNow('2026-10-01T18:30:00.000Z', () => {
    assert.equal(getTodayDateString(), '2026-10-02');
    assert.equal(getDayStatus('2026-10-01'), 'COMPLETED');
    assert.equal(getDayStatus('2026-10-02'), 'AVAILABLE');
  });
});

test('server uses the shared canonical journey date and IST boundary', () => {
  assert.equal(getJourneyDateString(1), '2026-10-01');
  assert.equal(getJourneyDateString(19), '2026-10-19');
  assert.equal(getTodayInKolkata(new Date('2026-10-01T18:29:59.000Z')), '2026-10-01');
  assert.equal(getTodayInKolkata(new Date('2026-10-01T18:30:00.000Z')), '2026-10-02');
});

test('the birthday unlocks on October 19 in Asia/Kolkata', () => {
  withNow('2026-10-18T18:29:59.000Z', () => {
    assert.equal(isBirthdayAvailable(), false);
  });

  withNow('2026-10-18T18:30:00.000Z', () => {
    assert.equal(isBirthdayAvailable(), true);
  });
});

test('countdown units roll over and stop at zero', () => {
  withNow('2026-10-17T19:30:00.000Z', () => {
    const remaining = calculateTimeRemaining();
    assert.equal(remaining.days, 0);
    assert.equal(remaining.hours, 23);
    assert.equal(remaining.minutes, 0);
    assert.equal(remaining.seconds, 0);
  });

  withNow('2026-10-18T18:29:00.000Z', () => {
    const remaining = calculateTimeRemaining();
    assert.equal(remaining.minutes, 1);
    assert.equal(remaining.seconds, 0);
  });

  withNow('2026-10-18T18:29:59.000Z', () => {
    assert.deepEqual(calculateTimeRemaining(), {
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 1,
      isExpired: false,
      totalMs: 1000,
    });
  });

  withNow('2026-10-18T18:30:00.000Z', () => {
    assert.deepEqual(calculateTimeRemaining(), {
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      isExpired: true,
      totalMs: 0,
    });
  });
});

test('owner test dates remain a client-only override', () => {
  withNow('2026-10-01T18:30:00.000Z', () => {
    assert.equal(getTodayDateString(undefined, '2026-10-10'), '2026-10-10');
    assert.equal(getTodayDateString(), '2026-10-02');
  });
});
