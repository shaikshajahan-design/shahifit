import { db } from '../db';
import type { ISODate, StepEntry } from '../../types';

export const stepRepository = {
  get(date: ISODate): Promise<StepEntry | undefined> {
    return db.steps.get(date);
  },

  async set(date: ISODate, steps: number): Promise<void> {
    await db.steps.put({ id: date, date, steps: Math.round(steps), updatedAt: Date.now() });
  },

  async remove(date: ISODate): Promise<StepEntry | undefined> {
    const existing = await db.steps.get(date);
    await db.steps.delete(date);
    return existing;
  },

  async restore(entry: StepEntry): Promise<void> {
    await db.steps.put(entry);
  },

  inRange(from: ISODate, to: ISODate): Promise<StepEntry[]> {
    return db.steps.where('date').between(from, to, true, true).sortBy('date');
  },

  /** All entries on or before `date`, newest first (used for streaks). */
  async upTo(date: ISODate): Promise<StepEntry[]> {
    return db.steps.where('date').belowOrEqual(date).reverse().toArray();
  },
};
