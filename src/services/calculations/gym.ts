import type { CalorieEstimate, ISODate, Intensity, Workout, WorkoutExercise, WorkoutKind } from '../../types';
import { ESTIMATE_SPREAD, MET } from '../../data/workoutTemplates';
import { daysInMonth, diffDays, startOfMonth } from '../../utils/date';

/**
 * Transparent MET estimate:  kcal ≈ MET × body weight (kg) × hours.
 * Returned as a range (±20%) because real expenditure varies a lot.
 */
export function estimateWorkoutCalories(
  kind: WorkoutKind,
  intensity: Intensity,
  minutes: number,
  weightKg: number,
): CalorieEstimate {
  const met = MET[kind][intensity];
  const mid = met * weightKg * (minutes / 60);
  const roundTo10 = (n: number) => Math.round(n / 10) * 10;
  return {
    mid: roundTo10(mid),
    low: roundTo10(mid * (1 - ESTIMATE_SPREAD)),
    high: roundTo10(mid * (1 + ESTIMATE_SPREAD)),
  };
}

export function groupExercises(exercises: WorkoutExercise[]): { group: string; exercises: string[] }[] {
  const map = new Map<string, string[]>();
  for (const e of exercises) {
    if (!map.has(e.group)) map.set(e.group, []);
    map.get(e.group)!.push(e.name);
  }
  return [...map.entries()].map(([group, list]) => ({ group, exercises: list }));
}

export function weekConsistency(workouts: Workout[], dates: ISODate[]) {
  const done = new Set(workouts.filter((w) => w.completed).map((w) => w.date));
  const days = dates.map((date) => ({ date, done: done.has(date) }));
  return { days, count: days.filter((d) => d.done).length };
}

export interface GymMonthStats {
  workouts: number;
  avgPerWeek: number;
  mostFrequent: string | null;
  totalMinutes: number;
  estimatedCalories: number;
}

export function gymMonthStats(workouts: Workout[], anyDateInMonth: ISODate, today: ISODate): GymMonthStats {
  const completed = workouts.filter((w) => w.completed);
  const start = startOfMonth(anyDateInMonth);
  const elapsed = start > today ? 0 : Math.min(daysInMonth(anyDateInMonth), diffDays(today, start) + 1);
  const counts = new Map<string, number>();
  for (const w of completed) counts.set(w.workoutName, (counts.get(w.workoutName) ?? 0) + 1);
  let mostFrequent: string | null = null;
  let max = 0;
  for (const [name, c] of counts) if (c > max) [mostFrequent, max] = [name, c];
  return {
    workouts: completed.length,
    avgPerWeek: elapsed > 0 ? Math.round((completed.length / elapsed) * 7 * 10) / 10 : 0,
    mostFrequent,
    totalMinutes: completed.reduce((s, w) => s + w.durationMinutes, 0),
    estimatedCalories: completed.reduce((s, w) => s + w.estimatedCalories.mid, 0),
  };
}
