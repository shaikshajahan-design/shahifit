import { db } from '../db';
import type { ISODate, WeightEntry } from '../../types';

export const weightRepository = {
  all(): Promise<WeightEntry[]> {
    return db.weights.orderBy('date').toArray();
  },

  get(date: ISODate): Promise<WeightEntry | undefined> {
    return db.weights.get(date);
  },

  /**
   * One entry per date. If this is the most recent entry, the body weight used for
   * calorie estimates (Settings) is updated too, so there is a single source of truth.
   */
  async upsert(date: ISODate, weight: number, waist?: number): Promise<void> {
    await db.transaction('rw', db.weights, db.settings, async () => {
      await db.weights.put({ id: date, date, weight, ...(waist ? { waist } : {}) });
      const latest = await db.weights.orderBy('date').last();
      if (latest && latest.date === date) {
        await db.settings.update('app', { bodyWeight: weight });
      }
    });
  },

  async remove(date: ISODate): Promise<WeightEntry | undefined> {
    const existing = await db.weights.get(date);
    await db.weights.delete(date);
    return existing;
  },

  async restore(entry: WeightEntry): Promise<void> {
    await db.weights.put(entry);
  },
};
