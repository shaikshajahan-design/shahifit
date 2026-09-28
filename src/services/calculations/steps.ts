import type { ISODate, StepEntry } from '../../types';
import { addDays, daysInMonth, diffDays, monthDates, startOfMonth } from '../../utils/date';

export function stepProgress(steps: number, target: number) {
  const percent = target > 0 ? Math.round(Math.min(steps / target, 1) * 100) : 0;
  return {
    percent,
    remaining: Math.max(target - steps, 0),
    achieved: target > 0 && steps >= target,
  };
}

/**
 * Consecutive calendar days (ending at `anchor`) on which steps >= target.
 * - If the anchor day itself is today and not yet achieved, it is "in progress",
 *   so counting starts from yesterday instead of breaking the streak.
 * - Future dates are never counted as missed.
 * - A day with no entry counts as missed.
 */
export function stepStreak(entries: StepEntry[], anchor: ISODate, today: ISODate, target: number): number {
  if (target <= 0) return 0;
  const byDate = new Map(entries.map((e) => [e.date, e.steps]));
  let day = anchor > today ? today : anchor;
  if ((byDate.get(day) ?? 0) < target) {
    if (day !== today) return 0;
    day = addDays(day, -1);
  }
  let count = 0;
  while ((byDate.get(day) ?? 0) >= target) {
    count++;
    day = addDays(day, -1);
  }
  return count;
}

export interface WeekDaySteps {
  date: ISODate;
  steps: number | null; // null = not logged
  isFuture: boolean;
}

export function weekSteps(entries: StepEntry[], dates: ISODate[], today: ISODate): WeekDaySteps[] {
  const byDate = new Map(entries.map((e) => [e.date, e.steps]));
  return dates.map((date) => ({ date, steps: byDate.has(date) ? byDate.get(date)! : null, isFuture: date > today }));
}

/** Average over logged days only (days with an entry). */
export function averageSteps(days: { steps: number | null }[]): { average: number; loggedDays: number } {
  const logged = days.filter((d) => d.steps !== null) as { steps: number }[];
  if (logged.length === 0) return { average: 0, loggedDays: 0 };
  return { average: Math.round(logged.reduce((s, d) => s + d.steps, 0) / logged.length), loggedDays: logged.length };
}

export function bestDay(entries: StepEntry[]): StepEntry | null {
  return entries.reduce<StepEntry | null>((best, e) => (!best || e.steps > best.steps ? e : best), null);
}

export interface MonthSummary {
  achieved: number;
  /** Days of the month that have passed (up to today), or the full month if in the past */
  eligibleDays: number;
  totalDays: number;
  percent: number;
  days: { date: ISODate; steps: number | null; achieved: boolean; isFuture: boolean }[];
}

export function monthSummary(entries: StepEntry[], anyDateInMonth: ISODate, today: ISODate, target: number): MonthSummary {
  const byDate = new Map(entries.map((e) => [e.date, e.steps]));
  const days = monthDates(anyDateInMonth).map((date) => {
    const steps = byDate.has(date) ? byDate.get(date)! : null;
    return { date, steps, achieved: steps !== null && steps >= target, isFuture: date > today };
  });
  const totalDays = daysInMonth(anyDateInMonth);
  const start = startOfMonth(anyDateInMonth);
  let eligibleDays: number;
  if (start > today) eligibleDays = 0;
  else eligibleDays = Math.min(totalDays, diffDays(today, start) + 1);
  const achieved = days.filter((d) => d.achieved && !d.isFuture).length;
  return {
    achieved,
    eligibleDays,
    totalDays,
    percent: eligibleDays > 0 ? Math.round((achieved / eligibleDays) * 100) : 0,
    days,
  };
}

/** Stride length estimated from height (≈ 0.415 × height), in metres. */
export function strideMetres(heightCm: number) {
  return (heightCm * 0.415) / 100;
}

export function estimateDistanceKm(steps: number, heightCm: number): number {
  return (steps * strideMetres(heightCm)) / 1000;
}

/**
 * Net walking energy ≈ 0.5 kcal per kg of body weight per km walked.
 * This is an estimate — it varies with pace, terrain and individual physiology.
 */
export function estimateWalkingKcal(steps: number, heightCm: number, weightKg: number): number {
  return Math.round(0.5 * weightKg * estimateDistanceKm(steps, heightCm));
}
