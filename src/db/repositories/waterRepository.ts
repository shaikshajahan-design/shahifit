import { db } from '../db';
import type { ISODate, WaterEntry } from '../../types';
import { newId } from '../../utils/id';

export const waterRepository = {
  forDate(date: ISODate): Promise<WaterEntry[]> {
    return db.water.where('date').equals(date).sortBy('createdAt');
  },

  async totalForDate(date: ISODate): Promise<number> {
    const rows = await waterRepository.forDate(date);
    return rows.reduce((s, r) => s + r.amountMl, 0);
  },

  async add(date: ISODate, amountMl: number): Promise<void> {
    await db.water.add({ id: newId(), date, amountMl, createdAt: Date.now() });
  },

  /** Removes the most recent water entry for the day. */
  async undoLast(date: ISODate): Promise<void> {
    const rows = await waterRepository.forDate(date);
    const last = rows[rows.length - 1];
    if (last) await db.water.delete(last.id);
  },
};
