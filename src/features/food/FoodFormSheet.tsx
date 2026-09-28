import { useEffect, useState } from 'react';
import { Trash2 } from 'lucide-react';
import type { FoodEntry, FoodTemplate, FoodUnit, MealId, SavedFood } from '../../types';
import { BottomSheet } from '../../components/BottomSheet';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { Field } from '../../components/Field';
import { useToast } from '../../components/Toast';
import { useSelectedDate } from '../../hooks/useSelectedDate';
import { foodRepository } from '../../db/repositories/foodRepository';
import { savedFoodRepository } from '../../db/repositories/savedFoodRepository';
import { FOOD_UNITS, MEALS, MEAL_LABEL } from '../../data/constants';
import { scaleFood } from '../../services/calculations/nutrition';
import { fmtInt, parseNumber } from '../../utils/format';
import { EMPTY_FORM, templateToForm, validateFoodForm, type FoodFormErrors, type FoodFormValues } from './foodForm';

export type FoodFormMode =
  | { kind: 'add'; meal: MealId; template?: FoodTemplate }
  | { kind: 'edit'; entry: FoodEntry }
  | { kind: 'saved'; saved?: SavedFood };

const entryToTemplate = (e: FoodEntry): FoodTemplate => ({
  name: e.foodName, quantity: e.quantity, unit: e.unit, calories: e.calories, protein: e.protein, carbs: e.carbs, fat: e.fat,
});
const savedToTemplate = (f: SavedFood): FoodTemplate => ({
  name: f.name, quantity: f.defaultQuantity, unit: f.unit, calories: f.calories, protein: f.protein, carbs: f.carbs, fat: f.fat,
});

/** Add food / edit a logged food / create or edit a saved food — one form, three modes. */
export function FoodFormSheet({ mode, onClose }: { mode: FoodFormMode | null; onClose: () => void }) {
  const { selectedDate } = useSelectedDate();
  const toast = useToast();

  const [values, setValues] = useState<FoodFormValues>(EMPTY_FORM);
  const [errors, setErrors] = useState<FoodFormErrors>({});
  const [meal, setMeal] = useState<MealId>('breakfast');
  const [saveToMyFoods, setSaveToMyFoods] = useState(false);
  /** Nutrition basis used to rescale values when quantity changes (only for prefilled foods). */
  const [base, setBase] = useState<FoodTemplate | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (!mode) return;
    setErrors({});
    setSaveToMyFoods(false);
    setConfirmDelete(false);
    if (mode.kind === 'add') {
      setMeal(mode.meal);
      setValues(mode.template ? templateToForm(mode.template) : EMPTY_FORM);
      setBase(mode.template ?? null);
    } else if (mode.kind === 'edit') {
      setMeal(mode.entry.meal);
      const t = entryToTemplate(mode.entry);
      setValues(templateToForm(t));
      setBase(mode.entry.quick ? null : t);
    } else {
      const t = mode.saved ? savedToTemplate(mode.saved) : null;
      setValues(t ? templateToForm(t) : EMPTY_FORM);
      setBase(t);
    }
  }, [mode]);

  if (!mode) return null;
  const isQuickEntry = mode.kind === 'edit' && !!mode.entry.quick;

  const set = (key: keyof FoodFormValues) => (v: string) => {
    setErrors((e) => ({ ...e, [key]: undefined }));
    if (key === 'quantity' && base) {
      const q = parseNumber(v);
      if (q > 0) {
        const scaled = templateToForm(scaleFood(base, q));
        setValues((cur) => ({ ...cur, quantity: v, calories: scaled.calories, protein: scaled.protein, carbs: scaled.carbs, fat: scaled.fat }));
        return;
      }
    }
    setValues((cur) => {
      const next = { ...cur, [key]: v };
      // A manual nutrition edit becomes the new basis for future quantity changes.
      if (base && ['calories', 'protein', 'carbs', 'fat'].includes(key)) {
        const q = parseNumber(next.quantity);
        const n = (s: string) => (parseNumber(s) >= 0 ? parseNumber(s) : 0);
        if (q > 0) setBase({ ...base, quantity: q, calories: n(next.calories), protein: n(next.protein), carbs: n(next.carbs), fat: n(next.fat) });
      }
      return next;
    });
  };

  const submit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    const result = validateFoodForm(isQuickEntry ? { ...values, name: values.name || 'Quick calories', quantity: '1' } : values);
    if (!result.ok) {
      setErrors(result.errors);
      return;
    }
    const f = result.value;
    try {
      if (mode.kind === 'saved') {
        if (mode.saved) await savedFoodRepository.update(mode.saved.id, { name: f.name, defaultQuantity: f.quantity, unit: f.unit, calories: f.calories, protein: f.protein, carbs: f.carbs, fat: f.fat });
        else await savedFoodRepository.upsert({ name: f.name, defaultQuantity: f.quantity, unit: f.unit, calories: f.calories, protein: f.protein, carbs: f.carbs, fat: f.fat });
        toast({ message: `Saved ${f.name} to My Foods` });
      } else if (mode.kind === 'edit') {
        await foodRepository.update(mode.entry.id, { foodName: f.name, quantity: f.quantity, unit: f.unit, calories: f.calories, protein: f.protein, carbs: f.carbs, fat: f.fat, meal });
        toast({ message: `Updated ${f.name}` });
      } else {
        const id = await foodRepository.add({ date: selectedDate, meal, foodName: f.name, quantity: f.quantity, unit: f.unit, calories: f.calories, protein: f.protein, carbs: f.carbs, fat: f.fat });
        if (saveToMyFoods) await savedFoodRepository.upsert({ name: f.name, defaultQuantity: f.quantity, unit: f.unit, calories: f.calories, protein: f.protein, carbs: f.carbs, fat: f.fat });
        toast({ message: `Added ${f.name} · ${fmtInt(f.calories)} kcal`, actionLabel: 'Undo', onAction: () => void foodRepository.remove(id) });
      }
      onClose();
    } catch {
      toast({ message: 'Could not save. Please try again.', tone: 'error' });
    }
  };

  const doDelete = async () => {
    setConfirmDelete(false);
    if (mode.kind === 'edit') {
      const removed = await foodRepository.remove(mode.entry.id);
      if (removed) toast({ message: `Removed ${removed.foodName}`, actionLabel: 'Undo', onAction: () => void foodRepository.restore(removed) });
    } else if (mode.kind === 'saved' && mode.saved) {
      await savedFoodRepository.remove(mode.saved.id);
      toast({ message: `Deleted ${mode.saved.name} from My Foods` });
    }
    onClose();
  };

  const title =
    mode.kind === 'saved' ? (mode.saved ? 'Edit saved food' : 'New saved food') : mode.kind === 'edit' ? 'Edit food' : 'Add food';
  const canDelete = mode.kind === 'edit' || (mode.kind === 'saved' && !!mode.saved);
  const formId = 'food-form';

  return (
    <>
      <BottomSheet
        open={!!mode}
        onClose={onClose}
        title={title}
        subtitle={mode.kind === 'saved' ? 'Nutrition for the default quantity' : `${MEAL_LABEL[meal]}`}
        size="tall"
        headerAction={
          canDelete ? (
            <button type="button" className="icon-btn icon-btn-danger" onClick={() => setConfirmDelete(true)} aria-label="Delete">
              <Trash2 size={19} />
            </button>
          ) : undefined
        }
        footer={
          <button type="submit" form={formId} className="btn btn-primary btn-block btn-lg">
            {mode.kind === 'saved' ? 'Save food' : mode.kind === 'edit' ? 'Save changes' : 'Add Food'}
          </button>
        }
      >
        <form id={formId} onSubmit={submit} noValidate className="form">
          {mode.kind !== 'saved' && (
            <div className="chip-row" role="radiogroup" aria-label="Meal">
              {MEALS.map((m) => (
                <button key={m.id} type="button" role="radio" aria-checked={m.id === meal} className={`chip ${m.id === meal ? 'chip-active' : ''}`} onClick={() => setMeal(m.id)}>
                  {m.label}
                </button>
              ))}
            </div>
          )}

          <Field label="Food name" value={values.name} onChange={set('name')} error={errors.name} placeholder="e.g. Chicken Breast" maxLength={60} autoCapitalize="words" />

          {!isQuickEntry && (
            <div className="field-grid">
              <Field label="Quantity" value={values.quantity} onChange={set('quantity')} error={errors.quantity} numeric="decimal" />
              <div className="field">
                <label className="field-label" htmlFor="unit-select">
                  Unit
                </label>
                <div className="field-control">
                  <select id="unit-select" value={values.unit} onChange={(e) => setValues((v) => ({ ...v, unit: e.target.value as FoodUnit }))}>
                    {FOOD_UNITS.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          <Field label="Calories" value={values.calories} onChange={set('calories')} error={errors.calories} numeric="numeric" suffix="kcal" className="field-strong" />

          {!isQuickEntry && (
            <div className="field-grid field-grid-3">
              <Field label="Protein" value={values.protein} onChange={set('protein')} error={errors.protein} numeric="decimal" suffix="g" placeholder="0" />
              <Field label="Carbs" value={values.carbs} onChange={set('carbs')} error={errors.carbs} numeric="decimal" suffix="g" placeholder="0" />
              <Field label="Fat" value={values.fat} onChange={set('fat')} error={errors.fat} numeric="decimal" suffix="g" placeholder="0" />
            </div>
          )}

          {base && !isQuickEntry && <p className="field-hint">Changing the quantity rescales calories and macros automatically.</p>}

          {mode.kind === 'add' && (
            <label className="check-row">
              <input type="checkbox" checked={saveToMyFoods} onChange={(e) => setSaveToMyFoods(e.target.checked)} />
              <span>Save to My Foods for faster logging</span>
            </label>
          )}
        </form>
      </BottomSheet>

      <ConfirmDialog
        open={confirmDelete}
        title={mode.kind === 'saved' ? 'Delete saved food?' : 'Delete this food?'}
        message={mode.kind === 'saved' ? 'It will be removed from My Foods. Your logged meals are not affected.' : 'This entry will be removed from the day.'}
        confirmLabel="Delete"
        destructive
        onConfirm={() => void doDelete()}
        onCancel={() => setConfirmDelete(false)}
      />
    </>
  );
}
