import { useEffect, useState } from 'react';
import type { MealId } from '../../types';
import { BottomSheet } from '../../components/BottomSheet';
import { Field } from '../../components/Field';
import { useToast } from '../../components/Toast';
import { useSelectedDate } from '../../hooks/useSelectedDate';
import { foodRepository } from '../../db/repositories/foodRepository';
import { LIMITS } from '../../data/defaultSettings';
import { MEALS } from '../../data/constants';
import { fmtInt, parseNumber } from '../../utils/format';

interface Props {
  open: boolean;
  meal: MealId;
  onClose: () => void;
}

export function QuickCaloriesSheet({ open, meal: initialMeal, onClose }: Props) {
  const { selectedDate } = useSelectedDate();
  const toast = useToast();
  const [meal, setMeal] = useState<MealId>(initialMeal);
  const [value, setValue] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setMeal(initialMeal);
      setValue('');
      setError(null);
    }
  }, [open, initialMeal]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const n = parseNumber(value);
    if (!(n > 0 && n <= LIMITS.calories.max)) {
      setError('Please enter a valid calorie value.');
      return;
    }
    const id = await foodRepository.addQuick(selectedDate, meal, Math.round(n));
    toast({ message: `Added ${fmtInt(n)} kcal`, actionLabel: 'Undo', onAction: () => void foodRepository.remove(id) });
    onClose();
  };

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title="Quick calories"
      subtitle="Add calories without macros"
      footer={
        <button type="submit" form="quick-form" className="btn btn-primary btn-block btn-lg">
          Add
        </button>
      }
    >
      <form id="quick-form" className="form" onSubmit={submit} noValidate>
        <div className="chip-row" role="radiogroup" aria-label="Meal">
          {MEALS.map((m) => (
            <button key={m.id} type="button" role="radio" aria-checked={m.id === meal} className={`chip ${m.id === meal ? 'chip-active' : ''}`} onClick={() => setMeal(m.id)}>
              {m.label}
            </button>
          ))}
        </div>
        <Field
          label="Calories"
          value={value}
          onChange={(v) => {
            setValue(v);
            setError(null);
          }}
          error={error}
          numeric="numeric"
          suffix="kcal"
          placeholder="650"
          className="field-xl"
          autoFocus
        />
      </form>
    </BottomSheet>
  );
}
