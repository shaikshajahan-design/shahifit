import { lazy, Suspense, useMemo, useState } from 'react';
import { CalendarClock, ChevronRight, Dumbbell, Pencil, Plus } from 'lucide-react';
import type { Workout } from '../../types';
import { EmptyState } from '../../components/EmptyState';
import { Section } from '../../components/Section';
import { useRecentWorkouts, useSettings, useTemplates, useWorkoutsForDate } from '../../hooks/useData';
import { useSelectedDate } from '../../hooks/useSelectedDate';
import { WEEKDAY_LONG, formatShortDate, weekdayIndex } from '../../utils/date';
import { fmtInt } from '../../utils/format';
import { WorkoutSummary } from './WorkoutSummary';
import { WorkoutLogSheet, type WorkoutSheetMode } from './WorkoutLogSheet';
import { WorkoutDetailSheet } from './WorkoutDetailSheet';
import { WeekConsistency } from './WeekConsistency';
import { ScheduleCard } from './ScheduleCard';
import { isWorkoutSlot, slotLabel } from './scheduleText';

const GymMonthCard = lazy(() => import('./GymMonthCard'));

export function GymPage() {
  const { selectedDate, isToday } = useSelectedDate();
  const settings = useSettings();
  const templates = useTemplates();
  const workouts = useWorkoutsForDate(selectedDate);
  const recent = useRecentWorkouts(8);
  const [sheet, setSheet] = useState<WorkoutSheetMode | null>(null);
  const [detail, setDetail] = useState<Workout | null>(null);

  const dayIdx = weekdayIndex(selectedDate);
  const planned = settings.schedule[dayIdx];
  const plannedIsWorkout = isWorkoutSlot(planned) && templates.some((t) => t.id === planned);
  const list = workouts ?? [];
  const recentOthers = useMemo(() => (recent ?? []).filter((w) => !list.some((x) => x.id === w.id)), [recent, list]);

  return (
    <div className="page">
      {list.length > 0 ? (
        list.map((w) => (
          <Section
            key={w.id}
            className="hero"
            title={isToday ? "Today's workout" : `Workout · ${formatShortDate(w.date)}`}
            action={
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setSheet({ kind: 'edit', workout: w })}>
                <Pencil size={15} aria-hidden="true" /> Edit
              </button>
            }
          >
            <h2 className="workout-title">{w.workoutName}</h2>
            <WorkoutSummary workout={w} />
          </Section>
        ))
      ) : (
        <Section className="hero" title={isToday ? "Today's workout" : `Workout · ${formatShortDate(selectedDate)}`}>
          <p className="plan-line">
            <CalendarClock size={16} aria-hidden="true" />
            {WEEKDAY_LONG[dayIdx]} plan: <strong>{slotLabel(planned, templates)}</strong>
          </p>
          <EmptyState
            compact
            icon={<Dumbbell size={24} />}
            title={isToday ? 'No workout recorded today.' : 'No workout recorded for this day.'}
            text={plannedIsWorkout ? 'Tick the exercises you did — no sets or reps needed.' : 'Rest day. Log a workout if you trained anyway.'}
          />
          {plannedIsWorkout ? (
            <div className="stack-sm">
              <button type="button" className="btn btn-primary btn-block btn-lg" onClick={() => setSheet({ kind: 'new', templateId: planned })}>
                <Plus size={20} aria-hidden="true" /> Start {slotLabel(planned, templates)}
              </button>
              <button type="button" className="btn btn-ghost btn-block" onClick={() => setSheet({ kind: 'new' })}>
                Choose a different workout
              </button>
            </div>
          ) : (
            <button type="button" className="btn btn-primary btn-block btn-lg" onClick={() => setSheet({ kind: 'new' })}>
              <Plus size={20} aria-hidden="true" /> Log a workout
            </button>
          )}
        </Section>
      )}

      {list.length > 0 && (
        <button type="button" className="btn btn-secondary btn-block" onClick={() => setSheet({ kind: 'new' })}>
          <Plus size={18} aria-hidden="true" /> Add another workout
        </button>
      )}

      <WeekConsistency />

      <ScheduleCard />

      <Suspense fallback={<div className="card chart-skeleton" aria-hidden="true" />}>
        <GymMonthCard />
      </Suspense>

      <Section title="Recent workouts" flush>
        {recentOthers.length === 0 ? (
          <p className="inline-empty">Your completed workouts will appear here.</p>
        ) : (
          <ul className="list list-padded">
            {recentOthers.map((w) => (
              <li key={w.id}>
                <button type="button" className="row-btn history-row" onClick={() => setDetail(w)}>
                  <span className="history-date">
                    <span>{formatShortDate(w.date).split(' ')[0]}</span>
                    <small>{formatShortDate(w.date).split(' ')[1]}</small>
                  </span>
                  <span className="row-main">
                    <span className="row-title">{w.workoutName}</span>
                    <span className="row-sub">
                      {w.durationMinutes} min · ~{fmtInt(w.estimatedCalories.mid)} kcal · {w.exercises.length} exercises
                    </span>
                  </span>
                  <ChevronRight size={18} className="row-chevron" aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <WorkoutLogSheet mode={sheet} onClose={() => setSheet(null)} />
      <WorkoutDetailSheet
        workout={detail}
        onClose={() => setDetail(null)}
        onEdit={(w) => {
          setDetail(null);
          setSheet({ kind: 'edit', workout: w });
        }}
      />
    </div>
  );
}
