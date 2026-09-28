import { useEffect, useMemo, useState } from 'react';
import { ChevronRight, Info, Trash2 } from 'lucide-react';
import type { Intensity, Workout, WorkoutTemplate } from '../../types';
import { BottomSheet } from '../../components/BottomSheet';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { SegmentedControl } from '../../components/SegmentedControl';
import { useToast } from '../../components/Toast';
import { useMuscleGroups, useSettings, useTemplates } from '../../hooks/useData';
import { useSelectedDate } from '../../hooks/useSelectedDate';
import { workoutRepository } from '../../db/repositories/workoutRepository';
import { DURATION_PRESETS, INTENSITIES } from '../../data/constants';
import { LIMITS } from '../../data/defaultSettings';
import { MET } from '../../data/workoutTemplates';
import { estimateWorkoutCalories } from '../../services/calculations/gym';
import { formatShortDate } from '../../utils/date';
import { fmt1, fmtInt, parseNumber } from '../../utils/format';
import { ExerciseChecklist } from './ExerciseChecklist';

export type WorkoutSheetMode = { kind: 'new'; templateId?: string } | { kind: 'edit'; workout: Workout };

interface Props {
  mode: WorkoutSheetMode | null;
  onClose: () => void;
}

/** Log a workout: pick type → tick exercises → duration & intensity → Complete. No sets/reps/weights. */
export function WorkoutLogSheet({ mode, onClose }: Props) {
  const { selectedDate } = useSelectedDate();
  const settings = useSettings();
  const templates = useTemplates();
  const groups = useMuscleGroups();
  const toast = useToast();

  const [templateId, setTemplateId] = useState<string | null>(null);
  const [selected, setSelected] = useState<Map<string, Set<string>>>(new Map());
  const [duration, setDuration] = useState(60);
  const [customDuration, setCustomDuration] = useState('');
  const [intensity, setIntensity] = useState<Intensity>('moderate');
  const [error, setError] = useState<string | null>(null);
  const [showMethod, setShowMethod] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (!mode) return;
    setError(null);
    setShowMethod(false);
    if (mode.kind === 'edit') {
      const w = mode.workout;
      setTemplateId(w.workoutType);
      const map = new Map<string, Set<string>>();
      for (const e of w.exercises) {
        if (!map.has(e.group)) map.set(e.group, new Set());
        map.get(e.group)!.add(e.name);
      }
      setSelected(map);
      setDuration(w.durationMinutes);
      setCustomDuration(DURATION_PRESETS.includes(w.durationMinutes) ? '' : String(w.durationMinutes));
      setIntensity(w.intensity);
    } else {
      setTemplateId(mode.templateId ?? null);
      setSelected(new Map());
      setDuration(60);
      setCustomDuration('');
      setIntensity('moderate');
    }
  }, [mode]);

  const template: WorkoutTemplate | undefined = templates.find((t) => t.id === templateId);
  const templateGroups = useMemo(
    () => (template ? template.groupIds.map((id) => groups.find((g) => g.id === id)).filter((g) => !!g) : []),
    [template, groups],
  );
  const estimate = template ? estimateWorkoutCalories(template.kind, intensity, duration, settings.bodyWeight) : null;
  const totalSelected = templateGroups.reduce((n, g) => n + [...(selected.get(g.name) ?? [])].filter((e) => g.exercises.includes(e)).length, 0);

  if (!mode) return null;

  const toggle = (groupName: string, name: string) => {
    setError(null);
    setSelected((prev) => {
      const next = new Map(prev);
      const set = new Set(next.get(groupName) ?? []);
      if (set.has(name)) set.delete(name);
      else set.add(name);
      next.set(groupName, set);
      return next;
    });
  };

  const selectAll = () => {
    const next = new Map<string, Set<string>>();
    for (const g of templateGroups) next.set(g.name, new Set(g.exercises));
    setSelected(next);
    setError(null);
  };

  const pickDuration = (m: number) => {
    setDuration(m);
    setCustomDuration('');
  };

  const onCustomDuration = (v: string) => {
    setCustomDuration(v);
    const n = parseNumber(v);
    if (Number.isInteger(n) && n >= LIMITS.duration.min && n <= LIMITS.duration.max) {
      setDuration(n);
      setError(null);
    }
  };

  const save = async () => {
    if (!template || !estimate) return;
    const exercises = templateGroups.flatMap((g) =>
      g.exercises.filter((e) => selected.get(g.name)?.has(e)).map((name) => ({ name, group: g.name })),
    );
    if (exercises.length === 0) return setError('Select at least one exercise you did.');
    if (customDuration) {
      const n = parseNumber(customDuration);
      if (!(Number.isInteger(n) && n >= LIMITS.duration.min && n <= LIMITS.duration.max)) {
        return setError(`Enter a duration between ${LIMITS.duration.min} and ${LIMITS.duration.max} minutes.`);
      }
    }
    const data = {
      date: mode.kind === 'edit' ? mode.workout.date : selectedDate,
      workoutType: template.id,
      workoutName: template.name,
      exercises,
      durationMinutes: duration,
      intensity,
      estimatedCalories: estimate,
      completed: true,
    };
    if (mode.kind === 'edit') {
      await workoutRepository.update(mode.workout.id, data);
      toast({ message: 'Workout updated' });
    } else {
      await workoutRepository.add(data);
      toast({ message: `${template.name} completed · ~${fmtInt(estimate.mid)} kcal` });
    }
    onClose();
  };

  const doDelete = async () => {
    setConfirmDelete(false);
    if (mode.kind !== 'edit') return;
    const removed = await workoutRepository.remove(mode.workout.id);
    if (removed) toast({ message: 'Workout deleted', actionLabel: 'Undo', onAction: () => void workoutRepository.restore(removed) });
    onClose();
  };

  const primary = templates.filter((t) => !t.optional);
  const optional = templates.filter((t) => t.optional);
  const dateLabel = formatShortDate(mode.kind === 'edit' ? mode.workout.date : selectedDate);

  return (
    <>
      <BottomSheet
        open={!!mode}
        onClose={onClose}
        title={template ? template.name : 'Choose workout'}
        subtitle={mode.kind === 'edit' ? `Editing · ${dateLabel}` : dateLabel}
        size="tall"
        headerAction={
          mode.kind === 'edit' ? (
            <button type="button" className="icon-btn icon-btn-danger" onClick={() => setConfirmDelete(true)} aria-label="Delete workout">
              <Trash2 size={19} />
            </button>
          ) : undefined
        }
        footer={
          template ? (
            <div className="footer-stack">
              {error && (
                <p className="field-error" role="alert">
                  {error}
                </p>
              )}
              <button type="button" className="btn btn-primary btn-block btn-lg" onClick={() => void save()}>
                {mode.kind === 'edit' ? 'Save changes' : 'Complete Workout'}
              </button>
            </div>
          ) : undefined
        }
      >
        {!template ? (
          <div className="template-picker">
            <div className="template-grid">
              {primary.map((t) => (
                <button key={t.id} type="button" className="template-btn" onClick={() => setTemplateId(t.id)}>
                  <span>{t.name}</span>
                  <ChevronRight size={17} aria-hidden="true" />
                </button>
              ))}
            </div>
            <h3 className="section-label">More</h3>
            <div className="template-grid template-grid-3">
              {optional.map((t) => (
                <button key={t.id} type="button" className="template-btn template-btn-sm" onClick={() => setTemplateId(t.id)}>
                  <span>{t.name}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="form">
            <div className="between">
              <button type="button" className="link-btn" onClick={() => setTemplateId(null)}>
                Change workout
              </button>
              <button type="button" className="link-btn" onClick={selectAll}>
                Select all
              </button>
            </div>

            {templateGroups.map((g) => (
              <ExerciseChecklist
                key={g.id}
                group={g}
                selected={selected.get(g.name) ?? new Set()}
                onToggle={(name) => toggle(g.name, name)}
                onAdded={(name) => {
                  setSelected((prev) => {
                    const next = new Map(prev);
                    next.set(g.name, new Set([...(next.get(g.name) ?? []), name]));
                    return next;
                  });
                }}
              />
            ))}

            <div className="field">
              <span className="field-label" id="dur-label">
                Duration
              </span>
              <div className="chip-row" role="radiogroup" aria-labelledby="dur-label">
                {DURATION_PRESETS.map((m) => (
                  <button
                    key={m}
                    type="button"
                    role="radio"
                    aria-checked={!customDuration && duration === m}
                    className={`chip ${!customDuration && duration === m ? 'chip-active' : ''}`}
                    onClick={() => pickDuration(m)}
                  >
                    {m} min
                  </button>
                ))}
                <div className={`chip chip-input ${customDuration ? 'chip-active' : ''}`}>
                  <input
                    value={customDuration}
                    onChange={(e) => onCustomDuration(e.target.value)}
                    inputMode="numeric"
                    placeholder="Other"
                    aria-label="Custom duration in minutes"
                    maxLength={3}
                  />
                  <span aria-hidden="true">min</span>
                </div>
              </div>
            </div>

            <div className="field">
              <span className="field-label">Intensity</span>
              <SegmentedControl<Intensity> label="Intensity" options={INTENSITIES} value={intensity} onChange={setIntensity} />
            </div>

            {estimate && (
              <div className="estimate-box">
                <div className="between">
                  <div>
                    <span className="estimate-label">Estimated calories</span>
                    <span className="estimate-value">~{fmtInt(estimate.mid)} kcal</span>
                    <span className="estimate-range">
                      Range {fmtInt(estimate.low)}–{fmtInt(estimate.high)} kcal · {totalSelected} exercise{totalSelected === 1 ? '' : 's'} · {duration} min
                    </span>
                  </div>
                  <button type="button" className="icon-btn" aria-expanded={showMethod} aria-label="How is this estimated?" onClick={() => setShowMethod((v) => !v)}>
                    <Info size={18} />
                  </button>
                </div>
                {showMethod && (
                  <p className="estimate-method">
                    MET method: {MET[template!.kind][intensity]} MET × {fmt1(settings.bodyWeight)} kg × {fmt1(duration / 60)} h. Real burn varies with rest times, effort and your body, so treat this as a rough guide. It is not subtracted from your food target.
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </BottomSheet>

      <ConfirmDialog
        open={confirmDelete}
        title="Delete workout?"
        message="This workout will be removed from your history."
        confirmLabel="Delete"
        destructive
        onConfirm={() => void doDelete()}
        onCancel={() => setConfirmDelete(false)}
      />
    </>
  );
}
