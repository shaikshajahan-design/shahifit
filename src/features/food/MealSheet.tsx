import { useMemo, useState } from 'react';
import { History, Pencil, Plus, Search, Star, Zap } from 'lucide-react';
import type { FoodEntry, FoodTemplate, MealId, SavedFood } from '../../types';
import { BottomSheet } from '../../components/BottomSheet';
import { EmptyState } from '../../components/EmptyState';
import { SegmentedControl } from '../../components/SegmentedControl';
import { useToast } from '../../components/Toast';
import { useFoodForDate, useRecentFoods, useSavedFoods } from '../../hooks/useData';
import { useSelectedDate } from '../../hooks/useSelectedDate';
import { foodRepository } from '../../db/repositories/foodRepository';
import { MEALS, MEAL_LABEL } from '../../data/constants';
import { sumNutrition } from '../../services/calculations/nutrition';
import { formatShortDate } from '../../utils/date';
import { fmtInt } from '../../utils/format';
import { FoodItem } from './FoodItem';
import { FoodFormSheet, type FoodFormMode } from './FoodFormSheet';
import { QuickCaloriesSheet } from './QuickCaloriesSheet';
import { describeFood } from './foodText';

interface Props {
  meal: MealId | null;
  onMealChange: (m: MealId) => void;
  onClose: () => void;
}

type PickTab = 'recent' | 'saved';

const savedToTemplate = (f: SavedFood): FoodTemplate => ({
  name: f.name,
  quantity: f.defaultQuantity,
  unit: f.unit,
  calories: f.calories,
  protein: f.protein,
  carbs: f.carbs,
  fat: f.fat,
});

export function MealSheet({ meal, onMealChange, onClose }: Props) {
  const { selectedDate } = useSelectedDate();
  const toast = useToast();
  const entries = useFoodForDate(selectedDate);
  const recent = useRecentFoods();
  const saved = useSavedFoods();

  const [pick, setPick] = useState<PickTab>('recent');
  const [query, setQuery] = useState('');
  const [form, setForm] = useState<FoodFormMode | null>(null);
  const [quickOpen, setQuickOpen] = useState(false);

  const mealEntries = useMemo(() => (entries ?? []).filter((e) => e.meal === meal), [entries, meal]);
  const mealKcal = sumNutrition(mealEntries).calories;

  const q = query.trim().toLowerCase();
  const recentList = useMemo(() => recent.filter((f) => f.name.toLowerCase().includes(q)), [recent, q]);
  const savedList = useMemo(() => (saved ?? []).filter((f) => f.name.toLowerCase().includes(q)), [saved, q]);

  if (!meal) return null;

  const quickAdd = async (t: FoodTemplate) => {
    const id = await foodRepository.add({ date: selectedDate, meal, foodName: t.name, quantity: t.quantity, unit: t.unit, calories: t.calories, protein: t.protein, carbs: t.carbs, fat: t.fat });
    toast({
      message: `Added ${t.name} · ${fmtInt(t.calories)} kcal`,
      actionLabel: 'Undo',
      onAction: () => void foodRepository.remove(id),
    });
  };

  const removeEntry = async (e: FoodEntry) => {
    const removed = await foodRepository.remove(e.id);
    if (removed) toast({ message: `Removed ${e.foodName}`, actionLabel: 'Undo', onAction: () => void foodRepository.restore(removed) });
  };

  const close = () => {
    setQuery('');
    onClose();
  };

  return (
    <>
      <BottomSheet
        open={!!meal}
        onClose={close}
        title={MEAL_LABEL[meal]}
        subtitle={`${formatShortDate(selectedDate)} · ${fmtInt(mealKcal)} kcal`}
        size="tall"
      >
        <div className="chip-row" role="radiogroup" aria-label="Meal">
          {MEALS.map((m) => (
            <button
              key={m.id}
              type="button"
              role="radio"
              aria-checked={m.id === meal}
              className={`chip ${m.id === meal ? 'chip-active' : ''}`}
              onClick={() => onMealChange(m.id)}
            >
              {m.label}
            </button>
          ))}
        </div>

        <div className="sheet-section">
          <h3 className="section-label">In this meal</h3>
          {mealEntries.length === 0 ? (
            <p className="muted-text">Nothing logged for {MEAL_LABEL[meal].toLowerCase()} yet.</p>
          ) : (
            <ul className="list">
              {mealEntries.map((e) => (
                <li key={e.id}>
                  <FoodItem entry={e} onEdit={() => setForm({ kind: 'edit', entry: e })} onDelete={() => void removeEntry(e)} />
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="action-pair">
          <button type="button" className="btn btn-secondary" onClick={() => setForm({ kind: 'add', meal })}>
            <Plus size={18} aria-hidden="true" /> New food
          </button>
          <button type="button" className="btn btn-secondary" onClick={() => setQuickOpen(true)}>
            <Zap size={18} aria-hidden="true" /> Quick calories
          </button>
        </div>

        <div className="sheet-section">
          <SegmentedControl<PickTab>
            label="Food source"
            options={[
              { id: 'recent', label: 'Recent' },
              { id: 'saved', label: 'My Foods' },
            ]}
            value={pick}
            onChange={setPick}
          />
          <div className="search">
            <Search size={17} aria-hidden="true" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={pick === 'recent' ? 'Search recent foods' : 'Search my foods'}
              aria-label="Search foods"
            />
          </div>

          {pick === 'recent' &&
            (recentList.length === 0 ? (
              <EmptyState
                compact
                icon={<History size={22} />}
                title={q ? 'No matches' : 'No recent foods yet'}
                text={q ? undefined : 'Foods you log will appear here for one-tap adding.'}
              />
            ) : (
              <ul className="list">
                {recentList.map((f) => (
                  <li key={f.name} className="pick-row">
                    <button type="button" className="pick-main" onClick={() => setForm({ kind: 'add', meal, template: f })}>
                      <span className="row-title">{f.name}</span>
                      <span className="row-sub">{describeFood(f)}</span>
                    </button>
                    <button type="button" className="icon-btn icon-btn-accent" onClick={() => void quickAdd(f)} aria-label={`Quick add ${f.name}`}>
                      <Plus size={20} />
                    </button>
                  </li>
                ))}
              </ul>
            ))}

          {pick === 'saved' && (
            <>
              {savedList.length === 0 ? (
                <EmptyState
                  compact
                  icon={<Star size={22} />}
                  title={q ? 'No matches' : 'No saved foods'}
                  text={q ? undefined : 'Save frequently used foods here for faster logging.'}
                />
              ) : (
                <ul className="list">
                  {savedList.map((f) => (
                    <li key={f.id} className="pick-row">
                      <button type="button" className="pick-main" onClick={() => setForm({ kind: 'add', meal, template: savedToTemplate(f) })}>
                        <span className="row-title">
                          {f.name}
                          {f.builtIn && <span className="tag">Starter</span>}
                        </span>
                        <span className="row-sub">{describeFood(savedToTemplate(f))}</span>
                      </button>
                      <button type="button" className="icon-btn" onClick={() => setForm({ kind: 'saved', saved: f })} aria-label={`Edit ${f.name}`}>
                        <Pencil size={17} />
                      </button>
                      <button type="button" className="icon-btn icon-btn-accent" onClick={() => void quickAdd(savedToTemplate(f))} aria-label={`Quick add ${f.name}`}>
                        <Plus size={20} />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              <button type="button" className="btn btn-ghost btn-block" onClick={() => setForm({ kind: 'saved' })}>
                <Plus size={18} aria-hidden="true" /> Create a saved food
              </button>
            </>
          )}
        </div>
      </BottomSheet>

      <FoodFormSheet mode={form} onClose={() => setForm(null)} />
      <QuickCaloriesSheet open={quickOpen} meal={meal} onClose={() => setQuickOpen(false)} />
    </>
  );
}
