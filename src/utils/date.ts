import type { ISODate } from '../types';

/*
 * All dates in ShahiFit are local calendar dates stored as 'YYYY-MM-DD'.
 * We never use toISOString() for dates, because that converts to UTC and
 * can shift an entry to the previous/next day (e.g. IST is UTC+5:30).
 */

const pad = (n: number) => String(n).padStart(2, '0');

export function toISODate(d: Date): ISODate {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Parse 'YYYY-MM-DD' into a local Date at noon (noon avoids DST edge cases). */
export function parseISODate(s: ISODate): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d, 12, 0, 0, 0);
}

export function isValidISODate(s: unknown): s is ISODate {
  if (typeof s !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const d = parseISODate(s);
  return toISODate(d) === s;
}

export function todayISO(now: Date = new Date()): ISODate {
  return toISODate(now);
}

export function addDays(s: ISODate, days: number): ISODate {
  const d = parseISODate(s);
  d.setDate(d.getDate() + days);
  return toISODate(d);
}

export function diffDays(a: ISODate, b: ISODate): number {
  // whole days from b to a
  const ms = parseISODate(a).getTime() - parseISODate(b).getTime();
  return Math.round(ms / 86_400_000);
}

/** Monday = 0 … Sunday = 6 */
export function weekdayIndex(s: ISODate): number {
  return (parseISODate(s).getDay() + 6) % 7;
}

/** Monday of the week containing s */
export function startOfWeek(s: ISODate): ISODate {
  return addDays(s, -weekdayIndex(s));
}

export function weekDates(s: ISODate): ISODate[] {
  const start = startOfWeek(s);
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}

export function startOfMonth(s: ISODate): ISODate {
  return `${s.slice(0, 7)}-01`;
}

export function daysInMonth(s: ISODate): number {
  const d = parseISODate(s);
  return new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
}

export function endOfMonth(s: ISODate): ISODate {
  return `${s.slice(0, 7)}-${pad(daysInMonth(s))}`;
}

export function monthDates(s: ISODate): ISODate[] {
  const start = startOfMonth(s);
  return Array.from({ length: daysInMonth(s) }, (_, i) => addDays(start, i));
}

export const WEEKDAY_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
export const WEEKDAY_LONG = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export function formatLongDate(s: ISODate): string {
  return parseISODate(s).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
}

export function formatShortDate(s: ISODate): string {
  return parseISODate(s).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

export function formatMonth(s: ISODate): string {
  return parseISODate(s).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
}

/** 'Today', 'Yesterday', 'Tomorrow' or the weekday name. */
export function relativeDayLabel(s: ISODate, today: ISODate = todayISO()): string {
  const diff = diffDays(s, today);
  if (diff === 0) return 'Today';
  if (diff === -1) return 'Yesterday';
  if (diff === 1) return 'Tomorrow';
  return WEEKDAY_LONG[weekdayIndex(s)];
}
