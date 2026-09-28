import type { FoodTemplate } from '../types';

/**
 * Built-in starter foods (approximate values from common nutrition tables).
 * These are seeded into "My Foods" as built-in items, clearly marked, and can be
 * edited or deleted. They are NOT food history — no fake log entries are created.
 */
export const DEFAULT_FOODS: FoodTemplate[] = [
  { name: 'Eggs (boiled)', quantity: 2, unit: 'piece', calories: 156, protein: 12.6, carbs: 1.2, fat: 10.6 },
  { name: 'Chicken Breast (cooked)', quantity: 100, unit: 'g', calories: 165, protein: 31, carbs: 0, fat: 3.6 },
  { name: 'Rice (cooked)', quantity: 150, unit: 'g', calories: 195, protein: 4, carbs: 42, fat: 0.5 },
  { name: 'Chapati', quantity: 1, unit: 'piece', calories: 120, protein: 3.5, carbs: 18, fat: 3.5 },
  { name: 'Oats (dry)', quantity: 40, unit: 'g', calories: 152, protein: 5.3, carbs: 26.5, fat: 2.8 },
  { name: 'Banana', quantity: 1, unit: 'piece', calories: 105, protein: 1.3, carbs: 27, fat: 0.4 },
  { name: 'Black Chana (boiled)', quantity: 100, unit: 'g', calories: 164, protein: 8.9, carbs: 27.4, fat: 2.6 },
  { name: 'Groundnuts (roasted)', quantity: 30, unit: 'g', calories: 176, protein: 7.1, carbs: 6.5, fat: 15 },
  { name: 'Sweet Corn (boiled)', quantity: 100, unit: 'g', calories: 96, protein: 3.4, carbs: 21, fat: 1.5 },
  { name: 'Dosa (plain)', quantity: 1, unit: 'piece', calories: 150, protein: 3.9, carbs: 25, fat: 3.7 },
];
