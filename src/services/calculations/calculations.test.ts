import { describe, expect, it } from 'vitest';
import { addDays, parseISODate, startOfWeek, toISODate, weekDates, weekdayIndex } from '../../utils/date';
import { averageSteps, monthSummary, stepProgress, stepStreak } from './steps';
import { mealTotals, remaining, scaleFood, sumNutrition } from './nutrition';
import { estimateWorkoutCalories, gymMonthStats, weekConsistency } from './gym';
import { weightTrend } from './weight';
import type { FoodEntry, StepEntry, Workout } from '../../types';

const s = (date: string, steps: number): StepEntry => ({ id: date, date, steps, updatedAt: 0 });

describe('dates', () => {
  it('round-trips local dates without UTC shift', () => {
    expect(toISODate(parseISODate('2026-09-28'))).toBe('2026-09-28');
    expect(toISODate(new Date(2026, 8, 28, 0, 5))).toBe('2026-09-28'); // just after midnight
    expect(toISODate(new Date(2026, 8, 28, 23, 55))).toBe('2026-09-28'); // just before midnight
  });
  it('handles month/year boundaries', () => {
    expect(addDays('2026-09-30', 1)).toBe('2026-10-01');
    expect(addDays('2026-01-01', -1)).toBe('2025-12-31');
    expect(addDays('2028-02-28', 1)).toBe('2028-02-29');
  });
  it('weeks start on Monday', () => {
    expect(weekdayIndex('2026-09-28')).toBe(0); // Monday
    expect(startOfWeek('2026-10-04')).toBe('2026-09-28'); // Sunday → Monday
    expect(weekDates('2026-09-30')).toHaveLength(7);
  });
});

describe('steps', () => {
  it('progress is capped at 100% and remaining never negative', () => {
    expect(stepProgress(8742, 10000)).toEqual({ percent: 87, remaining: 1258, achieved: false });
    expect(stepProgress(12500, 10000)).toEqual({ percent: 100, remaining: 0, achieved: true });
  });

  it('counts consecutive achieved days', () => {
    const e = [s('2026-09-24', 12000), s('2026-09-25', 10000), s('2026-09-26', 11000), s('2026-09-27', 10500)];
    expect(stepStreak(e, '2026-09-27', '2026-09-27', 10000)).toBe(4);
  });

  it("does not break the streak for today's in-progress day", () => {
    const e = [s('2026-09-26', 11000), s('2026-09-27', 10500), s('2026-09-28', 3000)];
    expect(stepStreak(e, '2026-09-28', '2026-09-28', 10000)).toBe(2);
  });

  it('a missed or unlogged day resets the streak', () => {
    const e = [s('2026-09-24', 12000), s('2026-09-25', 9000), s('2026-09-26', 11000)];
    expect(stepStreak(e, '2026-09-26', '2026-09-26', 10000)).toBe(1);
    const gap = [s('2026-09-24', 12000), s('2026-09-26', 11000)];
    expect(stepStreak(gap, '2026-09-26', '2026-09-26', 10000)).toBe(1);
  });

  it('a past date that missed has streak 0; future anchor clamps to today', () => {
    const e = [s('2026-09-25', 12000), s('2026-09-26', 9000)];
    expect(stepStreak(e, '2026-09-26', '2026-09-28', 10000)).toBe(0);
    expect(stepStreak([s('2026-09-27', 12000)], '2026-10-02', '2026-09-28', 10000)).toBe(1);
  });

  it('averages over logged days only', () => {
    expect(averageSteps([{ steps: 10000 }, { steps: null }, { steps: 8000 }])).toEqual({ average: 9000, loggedDays: 2 });
  });

  it('month summary only counts elapsed days', () => {
    const e = [s('2026-09-01', 10000), s('2026-09-02', 5000), s('2026-09-03', 15000)];
    const m = monthSummary(e, '2026-09-15', '2026-09-04', 10000);
    expect(m.achieved).toBe(2);
    expect(m.eligibleDays).toBe(4);
    expect(m.totalDays).toBe(30);
    expect(m.percent).toBe(50);
  });
});

describe('nutrition', () => {
  const f = (meal: FoodEntry['meal'], calories: number, protein = 0): FoodEntry => ({
    id: String(Math.random()), date: '2026-09-28', meal, foodName: 'x', quantity: 1, unit: 'g',
    calories, protein, carbs: 0, fat: 0, createdAt: 0,
  });
  it('sums totals and per-meal totals', () => {
    const e = [f('breakfast', 520, 30), f('lunch', 680, 50), f('lunch', 100, 2.5)];
    expect(sumNutrition(e).calories).toBe(1300);
    expect(sumNutrition(e).protein).toBe(82.5);
    expect(mealTotals(e).lunch.calories).toBe(780);
    expect(mealTotals(e).dinner.count).toBe(0);
  });
  it('remaining / over', () => {
    expect(remaining(2140, 2300)).toEqual({ remaining: 160, over: 0 });
    expect(remaining(2500, 2300)).toEqual({ remaining: 0, over: 200 });
  });
  it('scales a food by quantity', () => {
    const c = scaleFood({ name: 'Chicken', quantity: 100, unit: 'g', calories: 165, protein: 31, carbs: 0, fat: 3.6 }, 200);
    expect(c).toMatchObject({ calories: 330, protein: 62, fat: 7.2 });
  });
});

describe('gym', () => {
  it('MET estimate with honest range', () => {
    const e = estimateWorkoutCalories('strength', 'moderate', 60, 100);
    expect(e.mid).toBe(400);
    expect(e.low).toBe(320);
    expect(e.high).toBe(480);
  });
  it('weekly consistency counts completed workout days', () => {
    const w = (date: string, completed = true) => ({ date, completed }) as Workout;
    const r = weekConsistency([w('2026-09-28'), w('2026-09-29'), w('2026-09-29'), w('2026-09-30', false)], weekDates('2026-09-28'));
    expect(r.count).toBe(2);
  });
  it('month stats', () => {
    const w = (date: string, name: string, min: number) =>
      ({ date, workoutName: name, durationMinutes: min, completed: true, estimatedCalories: { mid: 300, low: 0, high: 0 } }) as Workout;
    const st = gymMonthStats([w('2026-09-01', 'Legs', 60), w('2026-09-03', 'Legs', 70), w('2026-09-05', 'Arms', 45)], '2026-09-10', '2026-09-14');
    expect(st.workouts).toBe(3);
    expect(st.mostFrequent).toBe('Legs');
    expect(st.totalMinutes).toBe(175);
    expect(st.avgPerWeek).toBe(1.5);
  });
});

describe('weight', () => {
  it('computes 7 and 30 day change', () => {
    const t = weightTrend([
      { id: '2026-08-28', date: '2026-08-28', weight: 106.4 },
      { id: '2026-09-20', date: '2026-09-20', weight: 105.0 },
      { id: '2026-09-28', date: '2026-09-28', weight: 104.6 },
    ]);
    expect(t.current).toBe(104.6);
    expect(t.change7).toBeCloseTo(-0.4);
    expect(t.change30).toBeCloseTo(-1.8);
  });
  it('returns nulls when there is no data', () => {
    expect(weightTrend([]).current).toBeNull();
  });
});
