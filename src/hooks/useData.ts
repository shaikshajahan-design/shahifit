/*
 * Reactive data hooks. UI components read data only through these hooks;
 * all storage logic lives in the repositories (src/db/repositories).
 * useLiveQuery re-runs automatically whenever the underlying IndexedDB tables change.
 */
import { useLiveQuery } from 'dexie-react-hooks';
import type { ISODate, Settings } from '../types';
import { foodRepository } from '../db/repositories/foodRepository';
import { savedFoodRepository } from '../db/repositories/savedFoodRepository';
import { stepRepository } from '../db/repositories/stepRepository';
import { workoutRepository } from '../db/repositories/workoutRepository';
import { weightRepository } from '../db/repositories/weightRepository';
import { waterRepository } from '../db/repositories/waterRepository';
import { settingsRepository } from '../db/repositories/settingsRepository';
import { DEFAULT_SETTINGS } from '../data/defaultSettings';

export function useSettings(): Settings {
  return useLiveQuery(() => settingsRepository.get(), [], DEFAULT_SETTINGS);
}

/* food */
export const useFoodForDate = (date: ISODate) => useLiveQuery(() => foodRepository.forDate(date), [date]);
export const useFoodInRange = (from: ISODate, to: ISODate) =>
  useLiveQuery(() => foodRepository.inRange(from, to), [from, to]);
export const useRecentFoods = () => useLiveQuery(() => foodRepository.recent(12), [], []);
export const useSavedFoods = () => useLiveQuery(() => savedFoodRepository.list(), []);

/* steps */
export const useStepsForDate = (date: ISODate) =>
  useLiveQuery(async () => (await stepRepository.get(date)) ?? null, [date]);
export const useStepsInRange = (from: ISODate, to: ISODate) =>
  useLiveQuery(() => stepRepository.inRange(from, to), [from, to]);
export const useStepsUpTo = (date: ISODate) => useLiveQuery(() => stepRepository.upTo(date), [date]);

/* gym */
export const useWorkoutsForDate = (date: ISODate) => useLiveQuery(() => workoutRepository.forDate(date), [date]);
export const useWorkoutsInRange = (from: ISODate, to: ISODate) =>
  useLiveQuery(() => workoutRepository.inRange(from, to), [from, to]);
export const useRecentWorkouts = (limit = 8) => useLiveQuery(() => workoutRepository.recent(limit), [limit]);
export const useTemplates = () => useLiveQuery(() => workoutRepository.templates(), [], []);
export const useMuscleGroups = () => useLiveQuery(() => workoutRepository.muscleGroups(), [], []);

/* weight & water */
export const useWeights = () => useLiveQuery(() => weightRepository.all(), []);
export const useWaterTotal = (date: ISODate) => useLiveQuery(() => waterRepository.totalForDate(date), [date], 0);
