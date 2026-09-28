import { useMemo } from 'react';
import type { TabId } from '../types';
import { useFoodForDate, useStepsForDate, useWorkoutsForDate } from '../hooks/useData';
import { useSelectedDate } from '../hooks/useSelectedDate';
import { sumNutrition } from '../services/calculations/nutrition';
import { fmtInt } from '../utils/format';

/** The compact one-line daily summary shown on every tab (instead of a Home tab). */
export function DaySummary({ onJump }: { onJump: (t: TabId) => void }) {
  const { selectedDate } = useSelectedDate();
  const food = useFoodForDate(selectedDate);
  const steps = useStepsForDate(selectedDate);
  const workouts = useWorkoutsForDate(selectedDate);

  const kcal = useMemo(() => sumNutrition(food ?? []).calories, [food]);
  const gymDone = (workouts ?? []).some((w) => w.completed);

  return (
    <div className="day-summary" aria-label="Daily summary">
      <button type="button" onClick={() => onJump('food')}>
        <strong>{fmtInt(kcal)}</strong> kcal
      </button>
      <span className="dot" aria-hidden="true">•</span>
      <button type="button" onClick={() => onJump('steps')}>
        <strong>{steps ? fmtInt(steps.steps) : '—'}</strong> steps
      </button>
      <span className="dot" aria-hidden="true">•</span>
      <button type="button" onClick={() => onJump('gym')}>
        Gym <strong aria-label={gymDone ? 'done' : 'not done'}>{gymDone ? '✓' : '—'}</strong>
      </button>
    </div>
  );
}
