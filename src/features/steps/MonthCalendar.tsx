import { useMemo } from 'react';
import { Check } from 'lucide-react';
import type { StepEntry } from '../../types';
import { Section } from '../../components/Section';
import { ProgressBar } from '../../components/ProgressBar';
import { useSettings } from '../../hooks/useData';
import { useSelectedDate } from '../../hooks/useSelectedDate';
import { monthSummary } from '../../services/calculations/steps';
import { WEEKDAY_SHORT, formatMonth, formatShortDate, weekdayIndex } from '../../utils/date';
import { fmtInt } from '../../utils/format';
import { goalName } from './goalName';

/** Compact month grid: ✓ = goal reached, outlined = logged but below goal, faint = not logged. */
export function MonthCalendar({ entries }: { entries: StepEntry[] }) {
  const { selectedDate, today, setSelectedDate } = useSelectedDate();
  const { stepTarget } = useSettings();
  const m = useMemo(() => monthSummary(entries, selectedDate, today, stepTarget), [entries, selectedDate, today, stepTarget]);
  const leading = weekdayIndex(m.days[0].date);
  const goal = goalName(stepTarget);

  return (
    <Section title={formatMonth(selectedDate)}>
      <div className="month-head">
        <div>
          <span className="month-label">{goal} goals achieved</span>
          <span className="month-value">
            <strong>{m.achieved}</strong> / {m.eligibleDays} days
          </span>
        </div>
        <span className="month-pct">{m.percent}%</span>
      </div>
      <ProgressBar value={m.achieved} max={Math.max(m.eligibleDays, 1)} label={`${goal} goals achieved this month`} size="sm" />

      <div className="cal" role="grid" aria-label={`${formatMonth(selectedDate)} step calendar`}>
        {WEEKDAY_SHORT.map((d) => (
          <span key={d} className="cal-dow" aria-hidden="true">
            {d.charAt(0)}
          </span>
        ))}
        {Array.from({ length: leading }, (_, i) => (
          <span key={`pad-${i}`} aria-hidden="true" />
        ))}
        {m.days.map((d) => {
          const state = d.isFuture ? 'future' : d.achieved ? 'hit' : d.steps !== null ? 'miss' : 'none';
          const desc =
            state === 'future' ? 'upcoming' : state === 'hit' ? `${fmtInt(d.steps!)} steps, goal reached` : state === 'miss' ? `${fmtInt(d.steps!)} steps` : 'not logged';
          return (
            <button
              key={d.date}
              type="button"
              className={`cal-day cal-${state} ${d.date === selectedDate ? 'cal-selected' : ''}`}
              disabled={d.isFuture}
              onClick={() => setSelectedDate(d.date)}
              aria-label={`${formatShortDate(d.date)}: ${desc}`}
              aria-current={d.date === selectedDate ? 'date' : undefined}
            >
              {state === 'hit' ? <Check size={14} strokeWidth={3} aria-hidden="true" /> : Number(d.date.slice(8))}
            </button>
          );
        })}
      </div>
      <div className="cal-legend" aria-hidden="true">
        <span><i className="lg lg-hit" /> Goal reached</span>
        <span><i className="lg lg-miss" /> Below goal</span>
        <span><i className="lg lg-none" /> Not logged</span>
      </div>
    </Section>
  );
}
