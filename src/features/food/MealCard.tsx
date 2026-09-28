import { ChevronRight, Coffee, Cookie, Moon, Sun } from 'lucide-react';
import type { MealId } from '../../types';
import { MEAL_LABEL } from '../../data/constants';
import { fmtInt } from '../../utils/format';

const ICONS: Record<MealId, typeof Sun> = { breakfast: Coffee, lunch: Sun, snacks: Cookie, dinner: Moon };

interface Props {
  meal: MealId;
  calories: number;
  count: number;
  onOpen: () => void;
}

export function MealCard({ meal, calories, count, onOpen }: Props) {
  const Icon = ICONS[meal];
  return (
    <button type="button" className="row-btn meal-card" onClick={onOpen}>
      <span className="row-icon" aria-hidden="true">
        <Icon size={19} />
      </span>
      <span className="row-main">
        <span className="row-title">{MEAL_LABEL[meal]}</span>
        <span className="row-sub">{count === 0 ? 'Tap to add' : `${count} item${count > 1 ? 's' : ''}`}</span>
      </span>
      <span className={`row-value ${count === 0 ? 'muted' : ''}`}>
        {count === 0 ? '—' : <>{fmtInt(calories)} <small>kcal</small></>}
      </span>
      <ChevronRight size={18} className="row-chevron" aria-hidden="true" />
    </button>
  );
}
