import { db } from '../db';
import type { FoodEntry, FoodTemplate, ISODate, MealId } from '../../types';
import { newId } from '../../utils/id';

export type NewFoodEntry = Omit<FoodEntry, 'id' | 'createdAt'>;

export const foodRepository = {
  forDate(date: ISODate): Promise<FoodEntry[]> {
    return db.foodEntries.where('date').equals(date).sortBy('createdAt');
  },

  inRange(from: ISODate, to: ISODate): Promise<FoodEntry[]> {
    return db.foodEntries.where('date').between(from, to, true, true).toArray();
  },

  async add(entry: NewFoodEntry): Promise<string> {
    const id = newId();
    await db.foodEntries.add({ ...entry, id, createdAt: Date.now() });
    return id;
  },

  async addQuick(date: ISODate, meal: MealId, calories: number): Promise<string> {
    return foodRepository.add({
      date,
      meal,
      foodName: 'Quick calories',
      quantity: 1,
      unit: 'serving',
      calories,
      protein: 0,
      carbs: 0,
      fat: 0,
      quick: true,
    });
  },

  async update(id: string, changes: Partial<NewFoodEntry>): Promise<void> {
    await db.foodEntries.update(id, changes);
  },

  async remove(id: string): Promise<FoodEntry | undefined> {
    const existing = await db.foodEntries.get(id);
    await db.foodEntries.delete(id);
    return existing;
  },

  async restore(entry: FoodEntry): Promise<void> {
    await db.foodEntries.put(entry);
  },

  /** Most recently logged distinct foods (by name), newest first. Quick-calorie entries are skipped. */
  async recent(limit = 12): Promise<FoodTemplate[]> {
    const seen = new Set<string>();
    const out: FoodTemplate[] = [];
    await db.foodEntries
      .orderBy('createdAt')
      .reverse()
      .until(() => out.length >= limit)
      .each((e) => {
        if (e.quick) return;
        const key = e.foodName.trim().toLowerCase();
        if (seen.has(key)) return;
        seen.add(key);
        out.push({
          name: e.foodName,
          quantity: e.quantity,
          unit: e.unit,
          calories: e.calories,
          protein: e.protein,
          carbs: e.carbs,
          fat: e.fat,
        });
      });
    return out;
  },
};
