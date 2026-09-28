import { Section } from '../../components/Section';
import MiniBarChart from '../../components/charts/MiniBarChart';
import type { ISODate } from '../../types';
import type { WeekDaySteps } from '../../services/calculations/steps';
import { WEEKDAY_LONG, WEEKDAY_SHORT, formatShortDate } from '../../utils/date';
import { fmtInt } from '../../utils/format';
import { goalName } from './goalName';

interface Props {
  days: WeekDaySteps[];
  average: number;
  loggedDays: number;
  target: number;
  selectedDate: ISODate;
  isCurrentWeek: boolean;
}

export default function WeeklyStepsCard({ days, average, loggedDays, target, selectedDate, isCurrentWeek }: Props) {
  const achieved = days.filter((d) => d.steps !== null && d.steps >= target).length;
  return (
    <Section title={isCurrentWeek ? 'This week' : `Week of ${formatShortDate(days[0].date)}`}>
      <p className="chart-summary">
        {loggedDays ? (
          <>
            Average <strong>{fmtInt(average)}</strong> steps/day
            <span className="muted"> · {goalName(target)} reached {achieved}×</span>
          </>
        ) : (
          <span className="muted">No steps logged this week yet.</span>
        )}
      </p>
      <MiniBarChart
        ariaLabel="Steps per day this week"
        data={days.map((d, i) => ({
          label: WEEKDAY_SHORT[i].charAt(0),
          title: `${WEEKDAY_LONG[i]}, ${formatShortDate(d.date)}`,
          value: d.steps,
          highlight: d.date === selectedDate,
        }))}
        target={target}
        format={fmtInt}
        unit="steps"
      />
    </Section>
  );
}
