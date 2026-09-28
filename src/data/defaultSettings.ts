import type { Settings } from '../types';
import { SCHEDULE_5_DAY } from './workoutTemplates';

export const DEFAULT_SETTINGS: Settings = {
  id: 'app',
  calorieTarget: 2300,
  proteinTarget: 160,
  stepTarget: 10000,
  waterTarget: 3000,
  weeklyWorkoutTarget: 5,
  bodyWeight: 75,
  height: 175,
  weightUnit: 'kg',
  theme: 'system',
  scheduleMode: '5day',
  schedule: [...SCHEDULE_5_DAY],
  lastBackupAt: null,
};

/** Sensible input limits used for validation across the app. */
export const LIMITS = {
  calorieTarget: { min: 800, max: 8000 },
  proteinTarget: { min: 10, max: 500 },
  stepTarget: { min: 1000, max: 100000 },
  waterTarget: { min: 500, max: 10000 },
  bodyWeight: { min: 25, max: 350 },
  height: { min: 100, max: 250 },
  waist: { min: 40, max: 250 },
  steps: { min: 0, max: 150000 },
  calories: { min: 0, max: 10000 },
  macro: { min: 0, max: 1000 },
  quantity: { min: 0.01, max: 100000 },
  duration: { min: 5, max: 400 },
};
