import { test } from 'node:test';
import assert from 'node:assert/strict';
import { toLocalDateString, parseLocalDate, addDaysToLocalDateString } from '../src/services/dateUtils.ts';

// Independent reference: format an instant as YYYY-MM-DD in the process time zone using Intl.
const reference = new Intl.DateTimeFormat('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit' });

test('toLocalDateString matches the local calendar date for every hour across 10 days', () => {
  const start = Date.UTC(2026, 9, 10, 0, 0, 0);
  for (let hour = 0; hour < 240; hour++) {
    const instant = new Date(start + hour * 3600 * 1000);
    assert.equal(toLocalDateString(instant), reference.format(instant), `hour offset ${hour}`);
  }
});

test('addDaysToLocalDateString advances one calendar day at a time for 400 days', () => {
  for (let k = 0; k < 400; k++) {
    const noon = new Date(2026, 0, 1 + k, 12, 0, 0);
    assert.equal(addDaysToLocalDateString('2026-01-01', k), reference.format(noon), `day offset ${k}`);
  }
});

test('parseLocalDate returns local midnight and rejects invalid dates', () => {
  const parsed = parseLocalDate('2026-10-16');
  assert.equal(parsed.getFullYear(), 2026);
  assert.equal(parsed.getMonth(), 9);
  assert.equal(parsed.getDate(), 16);
  assert.equal(parsed.getHours(), 0);
  assert.equal(toLocalDateString(parsed), '2026-10-16');
  assert.ok(Number.isNaN(parseLocalDate('2026-02-31').getTime()));
  assert.ok(Number.isNaN(parseLocalDate('abc').getTime()));
  assert.ok(Number.isNaN(parseLocalDate('2026-1-5').getTime()));
});
