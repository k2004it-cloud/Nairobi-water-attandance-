import test from 'node:test';
import assert from 'node:assert/strict';

import { getNairobiDateKey, isSameAttendanceDay } from './timePolicy.ts';

test('same attendance day matches Nairobi local dates', () => {
  const first = new Date('2026-08-05T07:00:00+03:00');
  const second = new Date('2026-08-05T15:30:00+03:00');

  assert.equal(getNairobiDateKey(first), '2026-08-05');
  assert.equal(isSameAttendanceDay(first, second), true);
  assert.equal(isSameAttendanceDay('2026-08-05', second), true);
});

test('different attendance day is not treated as same day', () => {
  const first = new Date('2026-08-05T23:00:00+03:00');
  const second = new Date('2026-08-06T00:30:00+03:00');

  assert.equal(isSameAttendanceDay(first, second), false);
});
