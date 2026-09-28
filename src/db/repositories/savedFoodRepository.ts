import { db } from '../db';
import type { SavedFood } from '../../types';
import { newId } from '../../utils/id';

export type SavedFoodInput = Omit<SavedFood, 'id' | 'createdAt' | 'updatedAt' | 'builtIn'>;

export const savedFoodRepository = {
  async list(): Promise<SavedFood[]> {
    const all = await db.savedFoods.toArray();
    return all.sort((a, b) => a.name.localeCompare(b.name));
  },

  async findByName(name: string): Promise<SavedFood | undefined> {
    const key = name.trim().toLowerCase();
    return db.savedFoods.filter((f) => f.name.trim().toLowerCase() === key).first();
  },

  /** Adds a new saved food, or updates the existing one with the same name. */
  async upsert(input: SavedFoodInput): Promise<string> {
    const existing = await savedFoodRepository.findByName(input.name);
    const now = Date.now();
    if (existing) {
      await db.savedFoods.update(existing.id, { ...input, updatedAt: now });
      return existing.id;
    }
    const id = newId();
    await db.savedFoods.add({ ...input, id, builtIn: false, createdAt: now, updatedAt: now });
    return id;
  },

  async update(id: string, input: SavedFoodInput): Promise<void> {
    await db.savedFoods.update(id, { ...input, updatedAt: Date.now() });
  },

  async remove(id: string): Promise<void> {
    await db.savedFoods.delete(id);
  },
};
