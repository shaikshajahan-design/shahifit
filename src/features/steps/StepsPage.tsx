import { lazy, Suspense, useMemo, useState } from 'react';
import { Activity, Flame, Footprints, Map as MapIcon, Pencil, Plus, Trophy, TrendingUp, Zap } from 'lucide-react';
import { ProgressRing } from '../../components/ProgressRing';
import { Section } from '../../components/Section';
import { StatCard } from '../../components/StatCard';
import { useSettings, useStepsForDate, useStepsInRange, useStepsUpTo } from '../../hooks/useData';
import { useSelectedDate } from '../../hooks/useSelectedDate';
import {
  averageSteps,
  bestDay,
  estimateDistanceKm,
  estimateWalkingKcal,
  stepProgress,
  stepStreak,
  weekSteps,
} from '../../services/calculations/steps';
import { formatShortDate, startOfMonth, endOfMonth, weekDates } from '../../utils/date';
import { fmt1, fmtInt } from '../../utils/format';
import { StepsEntrySheet } from './StepsEntrySheet';
import { MonthCalendar } from './MonthCalendar';
import { goalName } from './goalName';

const WeeklyStepsCard = lazy(() => import('./WeeklyStepsCard'));

export function StepsPage() {
  const { selectedDate, today, isToday } = useSelectedDate();
  const settings = useSettings();
  const entry = useStepsForDate(selectedDate);
  const history = useStepsUpTo(selectedDate);
  const monthEntries = useStepsInRange(startOfMonth(selectedDate), endOfMonth(selectedDate));
  const [editing, setEditing] = useState(false);

  const target = settings.stepTarget;
  const steps = entry?.steps ?? 0;
  const hasEntry = !!entry;
  const p = stepProgress(steps, target);
  const streak = useMemo(() => stepStreak(history ?? [], selectedDate, today, target), [history, selectedDate, today, target]);
  const best = useMemo(() => bestDay(monthEntries ?? []), [monthEntries]);
  const km = estimateDistanceKm(steps, settings.height);
  const kcal = estimateWalkingKcal(steps, settings.height, settings.bodyWeight);
  const goal = goalName(target);

  const weekDateList = useMemo(() => weekDates(selectedDate), [selectedDate]);
  const weekEntries = useStepsInRange(weekDateList[0], weekDateList[6]);
  const week = useMemo(() => {
    const days = weekSteps(weekEntries ?? [], weekDateList, today);
    return { days, ...averageSteps(days) };
  }, [weekEntries, weekDateList, today]);

  return (
    <div className="page">
      <Section className="hero hero-center">
        <ProgressRing value={steps} max={target} label={`Steps: ${p.percent}% of ${fmtInt(target)}`} tone={p.achieved ? 'success' : 'accent'}>
          <Footprints size={20} className="ring-icon" aria-hidden="true" />
          <span className="ring-value">{hasEntry ? fmtInt(steps) : '—'}</span>
          <span className="ring-sub">/ {fmtInt(target)}</span>
        </ProgressRing>

        {hasEntry ? (
          <p className="steps-status">
            {p.achieved ? (
              <span className="pill pill-success">
                <Trophy size={15} aria-hidden="true" /> {goal} achieved
              </span>
            ) : (
              <>
                <strong>{p.percent}%</strong>
                <span className="muted"> · {fmtInt(p.remaining)} steps remaining</span>
              </>
            )}
          </p>
        ) : (
          <p className="steps-status muted">
            {isToday ? `Enter today's steps to start your ${goal} progress.` : `No steps recorded for ${formatShortDate(selectedDate)}.`}
          </p>
        )}

        <p className={`streak ${streak > 0 ? 'streak-on' : ''}`}>
          <Flame size={16} aria-hidden="true" />
          {streak > 0 ? `${streak}-day ${goal} streak` : `No active ${goal} streak`}
        </p>

        <button type="button" className="btn btn-primary btn-lg btn-wide" onClick={() => setEditing(true)}>
          {hasEntry ? <Pencil size={18} aria-hidden="true" /> : <Plus size={20} aria-hidden="true" />}
          {hasEntry ? 'Update steps' : 'Enter Steps'}
        </button>
      </Section>

      <div className="stat-grid">
        <StatCard
          label="Weekly average"
          icon={<Activity size={15} aria-hidden="true" />}
          value={week.loggedDays ? fmtInt(week.average) : '—'}
          sub={week.loggedDays ? `steps/day · ${week.loggedDays} day${week.loggedDays > 1 ? 's' : ''} logged` : 'No steps this week'}
        />
        <StatCard
          label="Best day"
          icon={<TrendingUp size={15} aria-hidden="true" />}
          value={best ? fmtInt(best.steps) : '—'}
          sub={best ? `${formatShortDate(best.date)} · this month` : 'This month'}
        />
        <StatCard
          label="Estimated distance"
          icon={<MapIcon size={15} aria-hidden="true" />}
          value={hasEntry ? `~${fmt1(km)} km` : '—'}
          sub="Based on your height"
        />
        <StatCard
          label="Estimated active calories"
          icon={<Zap size={15} aria-hidden="true" />}
          value={hasEntry ? `~${fmtInt(kcal)} kcal` : '—'}
          sub="Walking estimate"
        />
      </div>

      <Suspense fallback={<div className="card chart-skeleton" aria-hidden="true" />}>
        <WeeklyStepsCard
          days={week.days}
          average={week.average}
          loggedDays={week.loggedDays}
          target={target}
          selectedDate={selectedDate}
          isCurrentWeek={weekDateList.includes(today)}
        />
      </Suspense>

      <MonthCalendar entries={monthEntries ?? []} />

      <StepsEntrySheet open={editing} onClose={() => setEditing(false)} current={entry ?? null} />
    </div>
  );
}
