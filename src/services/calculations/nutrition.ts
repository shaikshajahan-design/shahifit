import type { FoodEntry, FoodTemplate, MealId } from '../../types';
import { round1 } from '../../utils/format';

export interface NutritionTotals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export const ZERO_TOTALS: NutritionTotals = { calories: 0, protein: 0, carbs: 0, fat: 0 };

export function sumNutrition(entries: Pick<FoodEntry, 'calories' | 'protein' | 'carbs' | 'fat'>[]): NutritionTotals {
  const t = entries.reduce(
    (acc, e) => ({
      calories: acc.calories + (e.calories || 0),
      protein: acc.protein + (e.protein || 0),
      carbs: acc.carbs + (e.carbs || 0),
      fat: acc.fat + (e.fat || 0),
    }),
    { ...ZERO_TOTALS },
  );
  return { calories: Math.round(t.calories), protein: round1(t.protein), carbs: round1(t.carbs), fat: round1(t.fat) };
}

export function mealTotals(entries: FoodEntry[]): Record<MealId, NutritionTotals & { count: number }> {
  const meals: MealId[] = ['breakfast', 'lunch', 'snacks', 'dinner'];
  return Object.fromEntries(
    meals.map((m) => {
      const list = entries.filter((e) => e.meal === m);
      return [m, { ...sumNutrition(list), count: list.length }];
    }),
  ) as Record<MealId, NutritionTotals & { count: number }>;
}

export function remaining(consumed: number, target: number) {
  const diff = target - consumed;
  return { remaining: Math.max(diff, 0), over: Math.max(-diff, 0) };
}

/** Scale a food's nutrition from its base quantity to a new quantity. */
export function scaleFood(base: FoodTemplate, quantity: number): FoodTemplate {
  const f = base.quantity > 0 ? quantity / base.quantity : 1;
  return {
    ...base,
    quantity,
    calories: Math.round(base.calories * f),
    protein: round1(base.protein * f),
    carbs: round1(base.carbs * f),
    fat: round1(base.fat * f),
  };
}

/** Calories implied by macros (4/4/9) — used only as a gentle hint. */
export function caloriesFromMacros(protein: number, carbs: number, fat: number) {
  return Math.round(protein * 4 + carbs * 4 + fat * 9);
}
