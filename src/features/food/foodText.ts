import type { FoodTemplate } from '../../types';
import { UNIT_SHORT } from '../../data/constants';
import { fmt1, fmtInt } from '../../utils/format';

export function quantityText(quantity: number, unit: FoodTemplate['unit']) {
  return `${fmt1(quantity)} ${UNIT_SHORT[unit]}`;
}

/** "200 g · 330 kcal · 62 g protein" */
export function describeFood(f: FoodTemplate) {
  return `${quantityText(f.quantity, f.unit)} · ${fmtInt(f.calories)} kcal · ${fmt1(f.protein)} g protein`;
}
