import { useMemo, useState } from 'react';
import { Section } from '../../components/Section';
import { SegmentedControl } from '../../components/SegmentedControl';
import MiniBarChart from '../../components/charts/MiniBarChart';
import { useFoodInRange, useSettings } from '../../hooks/useData';
import { useSelectedDate } from '../../hooks/useSelectedDate';
import { sumNutrition } from '../../services/calculations/nutrition';
import { WEEKDAY_LONG, WEEKDAY_SHORT, formatShortDate, weekDates } from '../../utils/date';
import { fmt1, fmtInt } from '../../utils/format';

type Metric = 'calories' | 'protein';

export default function WeeklyFoodCard() {
  const { selectedDate, today } = useSelectedDate();
  const settings = useSettings();
  const dates = useMemo(() => weekDates(selectedDate), [selectedDate]);
  const entries = useFoodInRange(dates[0], dates[6]);
  const [metric, setMetric] = useState<Metric>('calories');

  const days = useMemo(
    () =>
      dates.map((date, i) => {
        const list = (entries ?? []).filter((e) => e.date === date);
        const t = sumNutrition(list);
        return { date, i, logged: list.length > 0, calories: t.calories, protein: t.protein };
      }),
    [dates, entries],
  );

  const logged = days.filter((d) => d.logged);
  const avg = logged.length ? logged.reduce((s, d) => s + d[metric], 0) / logged.length : 0;
  const target = metric === 'calories' ? settings.calorieTarget : settings.proteinTarget;
  const unit = metric === 'calories' ? 'kcal' : 'g';
  const format = metric === 'calories' ? fmtInt : fmt1;

  return (
    <Section
      title={dates.includes(today) ? 'This week' : `Week of ${formatShortDate(dates[0])}`}
      action={
        <SegmentedControl<Metric>
          size="sm"
          label="Weekly metric"
          value={metric}
          onChange={setMetric}
          options={[
            { id: 'calories', label: 'Calories' },
            { id: 'protein', label: 'Protein' },
          ]}
        />
      }
    >
      <p className="chart-summary">
        {logged.length ? (
          <>
            Average <strong>{format(avg)} {unit}</strong>/day <span className="muted">· {logged.length} day{logged.length > 1 ? 's' : ''} logged</span>
          </>
        ) : (
          <span className="muted">No food logged this week yet.</span>
        )}
      </p>
      <MiniBarChart
        ariaLabel={`${metric === 'calories' ? 'Calories' : 'Protein'} per day this week`}
        data={days.map((d) => ({
          label: WEEKDAY_SHORT[d.i].charAt(0),
          title: `${WEEKDAY_LONG[d.i]}, ${formatShortDate(d.date)}`,
          value: d.logged ? d[metric] : null,
          highlight: d.date === selectedDate,
        }))}
        target={target}
        format={format}
        unit={unit}
      />
    </Section>
  );
}
