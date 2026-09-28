import { useMemo } from 'react';
import { Check } from 'lucide-react';
import { Section } from '../../components/Section';
import { ProgressBar } from '../../components/ProgressBar';
import { useSettings, useWorkoutsInRange } from '../../hooks/useData';
import { useSelectedDate } from '../../hooks/useSelectedDate';
import { weekConsistency } from '../../services/calculations/gym';
import { WEEKDAY_LONG, WEEKDAY_SHORT, formatShortDate, weekDates } from '../../utils/date';

export function WeekConsistency() {
  const { selectedDate, today, setSelectedDate } = useSelectedDate();
  const { weeklyWorkoutTarget } = useSettings();
  const dates = useMemo(() => weekDates(selectedDate), [selectedDate]);
  const workouts = useWorkoutsInRange(dates[0], dates[6]);
  const { days, count } = useMemo(() => weekConsistency(workouts ?? [], dates), [workouts, dates]);
  const reached = count >= weeklyWorkoutTarget;

  return (
    <Section title={dates.includes(today) ? 'This week' : `Week of ${formatShortDate(dates[0])}`}>
      <ul className="week-strip">
        {days.map((d, i) => {
          const future = d.date > today;
          return (
            <li key={d.date}>
              <button
                type="button"
                className={`wk-day ${d.done ? 'wk-done' : ''} ${d.date === selectedDate ? 'wk-selected' : ''}`}
                disabled={future}
                onClick={() => setSelectedDate(d.date)}
                aria-label={`${WEEKDAY_LONG[i]}: ${d.done ? 'workout done' : future ? 'upcoming' : 'no workout'}`}
              >
                <span className="wk-label">{WEEKDAY_SHORT[i].toUpperCase()}</span>
                <span className="wk-mark" aria-hidden="true">
                  {d.done ? <Check size={16} strokeWidth={3} /> : '—'}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      <div className="between week-foot">
        <span>
          <strong>{count}</strong> workout{count === 1 ? '' : 's'} completed {reached && <span className="ok-mark">✓</span>}
        </span>
        <span className="muted">Weekly target: {weeklyWorkoutTarget} workouts</span>
      </div>
      <ProgressBar value={count} max={weeklyWorkoutTarget} label="Workouts this week" size="sm" tone={reached ? 'success' : 'accent'} />
    </Section>
  );
}
