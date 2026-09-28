import { useMemo } from 'react';
import { Section } from '../../components/Section';
import MiniBarChart from '../../components/charts/MiniBarChart';
import { useSettings, useWorkoutsInRange } from '../../hooks/useData';
import { useSelectedDate } from '../../hooks/useSelectedDate';
import { gymMonthStats } from '../../services/calculations/gym';
import { addDays, endOfMonth, formatMonth, formatShortDate, startOfMonth, startOfWeek } from '../../utils/date';
import { fmt1, fmtInt } from '../../utils/format';

const WEEKS = 8;

export default function GymMonthCard() {
  const { selectedDate, today } = useSelectedDate();
  const { weeklyWorkoutTarget } = useSettings();
  const monthStart = startOfMonth(selectedDate);
  const monthEnd = endOfMonth(selectedDate);
  const lastWeekStart = startOfWeek(selectedDate);
  const firstWeekStart = addDays(lastWeekStart, -7 * (WEEKS - 1));
  const rangeStart = firstWeekStart < monthStart ? firstWeekStart : monthStart;
  const rangeEnd = monthEnd > addDays(lastWeekStart, 6) ? monthEnd : addDays(lastWeekStart, 6);
  const workouts = useWorkoutsInRange(rangeStart, rangeEnd);

  const stats = useMemo(
    () => gymMonthStats((workouts ?? []).filter((w) => w.date >= monthStart && w.date <= monthEnd), selectedDate, today),
    [workouts, monthStart, monthEnd, selectedDate, today],
  );

  const weekly = useMemo(() => {
    return Array.from({ length: WEEKS }, (_, i) => {
      const start = addDays(firstWeekStart, i * 7);
      const end = addDays(start, 6);
      const days = new Set((workouts ?? []).filter((w) => w.completed && w.date >= start && w.date <= end).map((w) => w.date));
      return { start, count: days.size };
    });
  }, [workouts, firstWeekStart]);

  return (
    <Section title={formatMonth(selectedDate)}>
      <dl className="mini-stats">
        <div>
          <dt>Workouts</dt>
          <dd>{stats.workouts}</dd>
        </div>
        <div>
          <dt>Avg / week</dt>
          <dd>{fmt1(stats.avgPerWeek)}</dd>
        </div>
        <div>
          <dt>Total time</dt>
          <dd>
            {stats.totalMinutes >= 120 ? `${fmt1(stats.totalMinutes / 60)} h` : `${stats.totalMinutes} min`}
          </dd>
        </div>
        <div>
          <dt>Est. calories</dt>
          <dd>~{fmtInt(stats.estimatedCalories)}</dd>
        </div>
      </dl>
      <p className="chart-summary">
        Most frequent: <strong>{stats.mostFrequent ?? '—'}</strong>
      </p>
      <h4 className="section-label">Workouts per week · last {WEEKS} weeks</h4>
      <MiniBarChart
        ariaLabel={`Workout days per week, last ${WEEKS} weeks`}
        height={120}
        data={weekly.map((w) => ({
          label: formatShortDate(w.start).split(' ')[0],
          title: `Week of ${formatShortDate(w.start)}`,
          value: w.start > today ? null : w.count,
          highlight: w.start === lastWeekStart,
        }))}
        target={weeklyWorkoutTarget}
        format={fmtInt}
        unit="workouts"
      />
    </Section>
  );
}
