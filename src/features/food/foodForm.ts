import type { FoodTemplate, FoodUnit } from '../../types';
import { LIMITS } from '../../data/defaultSettings';
import { parseNumber } from '../../utils/format';

export interface FoodFormValues {
  name: string;
  quantity: string;
  unit: FoodUnit;
  calories: string;
  protein: string;
  carbs: string;
  fat: string;
}

export type FoodFormErrors = Partial<Record<keyof FoodFormValues, string>>;

export const EMPTY_FORM: FoodFormValues = {
  name: '',
  quantity: '100',
  unit: 'g',
  calories: '',
  protein: '',
  carbs: '',
  fat: '',
};

const num = (n: number) => (Number.isInteger(n) ? String(n) : String(Math.round(n * 10) / 10));

export function templateToForm(t: FoodTemplate): FoodFormValues {
  return {
    name: t.name,
    quantity: num(t.quantity),
    unit: t.unit,
    calories: num(t.calories),
    protein: num(t.protein),
    carbs: num(t.carbs),
    fat: num(t.fat),
  };
}

/** Validates the form. Returns parsed values or field errors. Blank macros count as 0. */
export function validateFoodForm(v: FoodFormValues): { ok: true; value: FoodTemplate } | { ok: false; errors: FoodFormErrors } {
  const errors: FoodFormErrors = {};
  const name = v.name.trim();
  if (!name) errors.name = 'Please enter a food name.';
  else if (name.length > 60) errors.name = 'Keep the name under 60 characters.';

  const quantity = parseNumber(v.quantity);
  if (!(quantity >= LIMITS.quantity.min && quantity <= LIMITS.quantity.max)) errors.quantity = 'Enter a quantity above 0.';

  const calories = parseNumber(v.calories);
  if (!(calories >= LIMITS.calories.min && calories <= LIMITS.calories.max)) errors.calories = 'Please enter a valid calorie value.';

  const macro = (s: string, key: 'protein' | 'carbs' | 'fat') => {
    if (s.trim() === '') return 0;
    const n = parseNumber(s);
    if (!(n >= LIMITS.macro.min && n <= LIMITS.macro.max)) {
      errors[key] = 'Enter a valid number of grams.';
      return 0;
    }
    return n;
  };
  const protein = macro(v.protein, 'protein');
  const carbs = macro(v.carbs, 'carbs');
  const fat = macro(v.fat, 'fat');

  if (Object.keys(errors).length) return { ok: false, errors };
  return {
    ok: true,
    value: {
      name,
      quantity,
      unit: v.unit,
      calories: Math.round(calories),
      protein: Math.round(protein * 10) / 10,
      carbs: Math.round(carbs * 10) / 10,
      fat: Math.round(fat * 10) / 10,
    },
  };
}
