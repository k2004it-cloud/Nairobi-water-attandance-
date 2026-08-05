import type { AttendanceWindowStatus } from './types';

/** Attendance is assessed against Nairobi local time, regardless of the server location. */
export const NAIROBI_TIME_ZONE = 'Africa/Nairobi';
export const CHECK_IN_POLICY = {
  opensAt: 6 * 60,
  onTimeUntil: 8 * 60,
  closesAt: 16 * 60
} as const;

const timePartsFormatter = new Intl.DateTimeFormat('en-GB', {
  timeZone: NAIROBI_TIME_ZONE,
  hour: '2-digit',
  minute: '2-digit',
  weekday: 'short',
  hourCycle: 'h23'
});

function getTimePart(parts: Intl.DateTimeFormatPart[], type: Intl.DateTimeFormatPartTypes): string {
  return parts.find((part) => part.type === type)?.value ?? '';
}

export function getNairobiTime(date = new Date()) {
  const parts = timePartsFormatter.formatToParts(date);
  const hours = Number(getTimePart(parts, 'hour'));
  const minutes = Number(getTimePart(parts, 'minute'));

  return {
    hours,
    minutes,
    totalMinutes: hours * 60 + minutes,
    weekday: getTimePart(parts, 'weekday')
  };
}

export function getNairobiDateKey(date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: NAIROBI_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(date);
}

export function addNairobiDays(dateInput: Date | string, days: number): string {
  const base = typeof dateInput === 'string' ? new Date(`${dateInput}T00:00:00`) : new Date(dateInput);
  const next = new Date(base);
  next.setUTCDate(next.getUTCDate() + days);
  return getNairobiDateKey(next);
}

export function isSameAttendanceDay(dateA: Date | string, dateB: Date | string): boolean {
  const keyA = typeof dateA === 'string' ? dateA : getNairobiDateKey(dateA);
  const keyB = typeof dateB === 'string' ? dateB : getNairobiDateKey(dateB);
  return keyA === keyB;
}

export function getSystemCheckInStatus(date = new Date()): AttendanceWindowStatus {
  const { totalMinutes } = getNairobiTime(date);

  if (totalMinutes < CHECK_IN_POLICY.opensAt || totalMinutes > CHECK_IN_POLICY.closesAt) {
    return 'CLOSED';
  }

  return totalMinutes <= CHECK_IN_POLICY.onTimeUntil ? 'ON TIME' : 'LATE';
}

export function getMinutesLate(date = new Date()): number {
  return Math.max(0, getNairobiTime(date).totalMinutes - CHECK_IN_POLICY.onTimeUntil);
}

export function isNairobiWeekend(date = new Date()): boolean {
  const { weekday } = getNairobiTime(date);
  return weekday === 'Sat' || weekday === 'Sun';
}

export function formatNairobiCheckInTime(date = new Date()): string {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: NAIROBI_TIME_ZONE,
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  }).format(date);
}

export function formatNairobiClockTime(date = new Date()): string {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: NAIROBI_TIME_ZONE,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23'
  }).format(date);
}

export function formatNairobiDate(date = new Date()): string {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: NAIROBI_TIME_ZONE,
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  })
    .format(date)
    .toUpperCase();
}
