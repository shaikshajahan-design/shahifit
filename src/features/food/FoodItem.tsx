import { Trash2, Zap } from 'lucide-react';
import type { FoodEntry } from '../../types';
import { fmt1, fmtInt } from '../../utils/format';
import { quantityText } from './foodText';

interface Props {
  entry: FoodEntry;
  onEdit: () => void;
  onDelete: () => void;
}

export function FoodItem({ entry, onEdit, onDelete }: Props) {
  return (
    <div className="food-item">
      <button type="button" className="food-item-main" onClick={onEdit} aria-label={`Edit ${entry.foodName}`}>
        <span className="row-title">
          {entry.quick && <Zap size={14} aria-hidden="true" className="inline-icon" />}
          {entry.foodName}
        </span>
        <span className="row-sub">
          {entry.quick
            ? 'Quick add · no macros'
            : `${quantityText(entry.quantity, entry.unit)} · P ${fmt1(entry.protein)} · C ${fmt1(entry.carbs)} · F ${fmt1(entry.fat)}`}
        </span>
      </button>
      <span className="food-item-kcal">
        {fmtInt(entry.calories)} <small>kcal</small>
      </span>
      <button type="button" className="icon-btn icon-btn-muted" onClick={onDelete} aria-label={`Delete ${entry.foodName}`}>
        <Trash2 size={17} />
      </button>
    </div>
  );
}
