import type { FoodUnit, Intensity, MealId } from '../types';

export const APP_VERSION = '1.0.0';
export const SCHEMA_VERSION = 1;

export const MEALS: { id: MealId; label: string }[] = [
  { id: 'breakfast', label: 'Breakfast' },
  { id: 'lunch', label: 'Lunch' },
  { id: 'snacks', label: 'Snacks' },
  { id: 'dinner', label: 'Dinner' },
];

export const MEAL_LABEL: Record<MealId, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  snacks: 'Snacks',
  dinner: 'Dinner',
};

/** Suggest a meal from the time of day. */
export function mealForHour(hour: number): MealId {
  if (hour < 11) return 'breakfast';
  if (hour < 16) return 'lunch';
  if (hour < 19) return 'snacks';
  return 'dinner';
}

export const FOOD_UNITS: { id: FoodUnit; label: string }[] = [
  { id: 'g', label: 'grams' },
  { id: 'ml', label: 'ml' },
  { id: 'piece', label: 'piece' },
  { id: 'cup', label: 'cup' },
  { id: 'bowl', label: 'bowl' },
  { id: 'serving', label: 'serving' },
  { id: 'tbsp', label: 'tbsp' },
];

export const UNIT_SHORT: Record<FoodUnit, string> = {
  g: 'g',
  ml: 'ml',
  piece: 'pc',
  cup: 'cup',
  bowl: 'bowl',
  serving: 'serving',
  tbsp: 'tbsp',
};

export const INTENSITIES: { id: Intensity; label: string }[] = [
  { id: 'light', label: 'Light' },
  { id: 'moderate', label: 'Moderate' },
  { id: 'hard', label: 'Hard' },
];

export const DURATION_PRESETS = [30, 45, 60, 75, 90];

export const WATER_QUICK_ADD = [250, 500, 750];
