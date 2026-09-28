import type { Intensity, MuscleGroup, WeeklySchedule, WorkoutKind, WorkoutTemplate } from '../types';

/**
 * Exercise library, grouped by muscle group. Groups are shared between templates,
 * so a custom exercise added to "Chest" shows up in both Chest + Triceps and Chest + Back.
 */
export const DEFAULT_MUSCLE_GROUPS: MuscleGroup[] = [
  { id: 'chest', name: 'Chest', exercises: ['Bench Press', 'Incline Dumbbell Press', 'Cable Fly'] },
  { id: 'triceps', name: 'Triceps', exercises: ['Triceps Pushdown', 'Overhead Extension', 'Dips'] },
  { id: 'back', name: 'Back', exercises: ['Lat Pulldown', 'Barbell Row', 'Seated Cable Row'] },
  { id: 'biceps', name: 'Biceps', exercises: ['Barbell Curl', 'Hammer Curl', 'Preacher Curl'] },
  { id: 'legs', name: 'Legs', exercises: ['Squat', 'Leg Press', 'Romanian Deadlift', 'Leg Curl', 'Calf Raise'] },
  { id: 'shoulders', name: 'Shoulders', exercises: ['Overhead Press', 'Lateral Raise', 'Rear Delt Fly'] },
  { id: 'abs', name: 'Abs', exercises: ['Plank', 'Hanging Leg Raise', 'Cable Crunch'] },
  { id: 'fullbody', name: 'Full Body', exercises: ['Squat', 'Bench Press', 'Barbell Row', 'Overhead Press', 'Deadlift'] },
  { id: 'cardio', name: 'Cardio', exercises: ['Treadmill', 'Cycling', 'Cross Trainer', 'Stair Climber', 'Rowing'] },
];

export const DEFAULT_TEMPLATES: WorkoutTemplate[] = [
  { id: 'chest-triceps', name: 'Chest + Triceps', groupIds: ['chest', 'triceps'], kind: 'strength', optional: false, order: 1 },
  { id: 'back-biceps', name: 'Back + Biceps', groupIds: ['back', 'biceps'], kind: 'strength', optional: false, order: 2 },
  { id: 'legs', name: 'Legs', groupIds: ['legs'], kind: 'strength', optional: false, order: 3 },
  { id: 'shoulders-abs', name: 'Shoulders + Abs', groupIds: ['shoulders', 'abs'], kind: 'strength', optional: false, order: 4 },
  { id: 'chest-back', name: 'Chest + Back', groupIds: ['chest', 'back'], kind: 'strength', optional: false, order: 5 },
  { id: 'arms', name: 'Arms', groupIds: ['biceps', 'triceps'], kind: 'strength', optional: true, order: 6 },
  { id: 'full-body', name: 'Full Body', groupIds: ['fullbody'], kind: 'strength', optional: true, order: 7 },
  { id: 'cardio', name: 'Cardio', groupIds: ['cardio'], kind: 'cardio', optional: true, order: 8 },
];

export const REST = 'rest';
export const OPTIONAL = 'optional';

/** Monday … Sunday */
export const SCHEDULE_5_DAY: WeeklySchedule = [
  'chest-triceps',
  'back-biceps',
  'legs',
  'shoulders-abs',
  'chest-back',
  OPTIONAL,
  REST,
];

export const SCHEDULE_4_DAY: WeeklySchedule = [
  'chest-triceps',
  'back-biceps',
  REST,
  'shoulders-abs',
  'legs',
  OPTIONAL,
  REST,
];

/**
 * MET values (metabolic equivalents) used for the transparent calorie estimate.
 * Based on the Compendium of Physical Activities: resistance training ≈ 3.5 (light)
 * to 6.0 (vigorous); these session-level values allow for rest between exercises.
 */
export const MET: Record<WorkoutKind, Record<Intensity, number>> = {
  strength: { light: 3.0, moderate: 4.0, hard: 5.5 },
  cardio: { light: 4.0, moderate: 7.0, hard: 9.0 },
};

/** ± spread applied to the MET estimate to show an honest range. */
export const ESTIMATE_SPREAD = 0.2;
