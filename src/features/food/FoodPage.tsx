import { lazy, Suspense, useMemo, useState } from 'react';
import { Plus, Utensils } from 'lucide-react';
import type { FoodEntry, MealId } from '../../types';
import { useFoodForDate, useSettings } from '../../hooks/useData';
import { useSelectedDate } from '../../hooks/useSelectedDate';
import { mealTotals, remaining, sumNutrition } from '../../services/calculations/nutrition';
import { MEALS, mealForHour } from '../../data/constants';
import { fmt1, fmtInt } from '../../utils/format';
import { ProgressBar } from '../../components/ProgressBar';
import { Section } from '../../components/Section';
import { MealCard } from './MealCard';
import { MealSheet } from './MealSheet';
import { WaterCard } from '../water/WaterCard';

const WeeklyFoodCard = lazy(() => import('./WeeklyFoodCard'));

export function FoodPage() {
  const { selectedDate } = useSelectedDate();
  const settings = useSettings();
  const entries = useFoodForDate(selectedDate);
  const [openMeal, setOpenMeal] = useState<MealId | null>(null);

  const list: FoodEntry[] = entries ?? [];
  const totals = useMemo(() => sumNutrition(list), [list]);
  const meals = useMemo(() => mealTotals(list), [list]);
  const cal = remaining(totals.calories, settings.calorieTarget);
  const pro = remaining(totals.protein, settings.proteinTarget);
  const over = cal.over > 0;

  return (
    <div className="page">
      <Section className="hero">
        <div className="hero-top">
          <span className="card-label">Calories</span>
          <span className={`pill ${over ? 'pill-warning' : ''}`}>
            {over ? `${fmtInt(cal.over)} kcal over` : `${fmtInt(cal.remaining)} kcal remaining`}
          </span>
        </div>
        <p className="metric">
          <span className="metric-value">{fmtInt(totals.calories)}</span>
          <span className="metric-unit">/ {fmtInt(settings.calorieTarget)} kcal</span>
        </p>
        <ProgressBar
          value={totals.calories}
          max={settings.calorieTarget}
          label="Calories consumed"
          tone={over ? 'warning' : 'accent'}
          size="lg"
        />

        <div className="hero-divider" />

        <div className="macro-row">
          <div className="macro-main">
            <div className="macro-line">
              <span className="macro-name">Protein</span>
              <span className="macro-val">
                <strong>{fmt1(totals.protein)}</strong> / {fmtInt(settings.proteinTarget)} g
              </span>
            </div>
            <ProgressBar value={totals.protein} max={settings.proteinTarget} label="Protein" tone={pro.remaining === 0 ? 'success' : 'accent'} size="sm" />
            <span className="macro-note">
              {pro.remaining > 0 ? `${fmt1(pro.remaining)} g protein remaining` : 'Protein target reached ✓'}
            </span>
          </div>
          <div className="macro-mini">
            <div>
              <span className="macro-name">Carbs</span>
              <span className="macro-small">{fmtInt(totals.carbs)} g</span>
            </div>
            <div>
              <span className="macro-name">Fat</span>
              <span className="macro-small">{fmtInt(totals.fat)} g</span>
            </div>
          </div>
        </div>
      </Section>

      <Section title="Meals" flush>
        {list.length === 0 && (
          <p className="inline-empty">
            <Utensils size={16} aria-hidden="true" /> No meals recorded yet. Start tracking today&rsquo;s meals.
          </p>
        )}
        <ul className="meal-list">
          {MEALS.map((m) => (
            <li key={m.id}>
              <MealCard meal={m.id} calories={meals[m.id].calories} count={meals[m.id].count} onOpen={() => setOpenMeal(m.id)} />
            </li>
          ))}
        </ul>
      </Section>

      <button type="button" className="btn btn-primary btn-block btn-lg" onClick={() => setOpenMeal(mealForHour(new Date().getHours()))}>
        <Plus size={20} aria-hidden="true" /> Add Food
      </button>

      <WaterCard />

      <Suspense fallback={<div className="card chart-skeleton" aria-hidden="true" />}>
        <WeeklyFoodCard />
      </Suspense>

      <MealSheet meal={openMeal} onMealChange={setOpenMeal} onClose={() => setOpenMeal(null)} />
    </div>
  );
}
