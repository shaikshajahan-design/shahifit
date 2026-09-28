import { CheckCircle2, Check, Clock, Flame, Gauge } from 'lucide-react';
import type { Workout } from '../../types';
import { groupExercises } from '../../services/calculations/gym';
import { INTENSITIES } from '../../data/constants';
import { fmtInt } from '../../utils/format';

/** The read-only workout summary (used for today's workout and history details). */
export function WorkoutSummary({ workout, showNames = true }: { workout: Workout; showNames?: boolean }) {
  const groups = groupExercises(workout.exercises);
  const intensity = INTENSITIES.find((i) => i.id === workout.intensity)?.label;
  const e = workout.estimatedCalories;
  return (
    <div className="workout-summary">
      <div className="ws-groups">
        {groups.map((g) => (
          <div key={g.group} className="ws-group">
            <div className="ws-group-head">
              <span className="ws-group-name">{g.group}</span>
              <span className="ws-group-count">
                {g.exercises.length} exercise{g.exercises.length === 1 ? '' : 's'}
              </span>
            </div>
            {showNames && (
              <ul className="ws-exercises">
                {g.exercises.map((x) => (
                  <li key={x}>
                    <Check size={15} strokeWidth={2.6} aria-hidden="true" /> {x}
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
      <div className="ws-metrics">
        <div>
          <span className="ws-label">
            <Clock size={14} aria-hidden="true" /> Duration
          </span>
          <span className="ws-value">{workout.durationMinutes} min</span>
        </div>
        <div>
          <span className="ws-label">
            <Flame size={14} aria-hidden="true" /> Est. calories
          </span>
          <span className="ws-value">~{fmtInt(e.mid)} kcal</span>
          <span className="ws-range">{fmtInt(e.low)}–{fmtInt(e.high)}</span>
        </div>
        <div>
          <span className="ws-label">
            <Gauge size={14} aria-hidden="true" /> Intensity
          </span>
          <span className="ws-value">{intensity}</span>
        </div>
      </div>
      {workout.completed && (
        <p className="ws-done">
          <CheckCircle2 size={17} aria-hidden="true" /> Workout completed
        </p>
      )}
    </div>
  );
}
