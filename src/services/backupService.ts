import { ALL_TABLES, buildSeed, db } from '../db/db';
import type {
  BackupFile,
  FoodEntry,
  MuscleGroup,
  SavedFood,
  Settings,
  StepEntry,
  WaterEntry,
  WeightEntry,
  Workout,
  WorkoutTemplate,
} from '../types';
import { SCHEMA_VERSION } from '../data/constants';
import { DEFAULT_SETTINGS } from '../data/defaultSettings';
import { DEFAULT_MUSCLE_GROUPS, DEFAULT_TEMPLATES } from '../data/workoutTemplates';
import { isValidISODate, todayISO } from '../utils/date';

export const INVALID_BACKUP_MESSAGE = 'This backup file is invalid or incompatible.';

export class BackupError extends Error {}

/* ---------------------------------------------------------------- export */

export async function createBackup(): Promise<BackupFile> {
  return db.transaction('r', ALL_TABLES(), async () => {
    const [foodEntries, savedFoods, steps, workouts, muscleGroups, workoutTemplates, weights, water, settingsRow] =
      await Promise.all([
        db.foodEntries.toArray(),
        db.savedFoods.toArray(),
        db.steps.toArray(),
        db.workouts.toArray(),
        db.muscleGroups.toArray(),
        db.workoutTemplates.toArray(),
        db.weights.toArray(),
        db.water.toArray(),
        db.settings.get('app'),
      ]);
    return {
      app: 'ShahiFit',
      schemaVersion: SCHEMA_VERSION,
      exportedAt: new Date().toISOString(),
      data: {
        foodEntries,
        savedFoods,
        steps,
        workouts,
        muscleGroups,
        workoutTemplates,
        weights,
        water,
        settings: { ...DEFAULT_SETTINGS, ...(settingsRow ?? {}) } as Settings,
      },
    };
  });
}

export function backupFileName(date = todayISO()): string {
  return `shahifit-backup-${date}.json`;
}

/** Builds the backup and triggers a download. Works fully offline. */
export async function downloadBackup(): Promise<string> {
  const backup = await createBackup();
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const name = backupFileName();
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
  await db.settings.update('app', { lastBackupAt: Date.now() });
  return name;
}

/* ------------------------------------------------------------ validation */

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const isStr = (v: unknown): v is string => typeof v === 'string' && v.length > 0;
const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
const isNonNeg = (v: unknown): v is number => isNum(v) && v >= 0;

const MEAL_IDS = ['breakfast', 'lunch', 'snacks', 'dinner'];
const UNITS = ['g', 'ml', 'piece', 'cup', 'bowl', 'serving', 'tbsp'];
const INTENSITY = ['light', 'moderate', 'hard'];

function arr(data: Record<string, unknown>, key: string): unknown[] {
  const v = data[key];
  if (v === undefined) return [];
  if (!Array.isArray(v)) throw new BackupError(`"${key}" must be a list`);
  return v;
}

function check<T>(list: unknown[], name: string, valid: (r: Record<string, unknown>) => boolean): T[] {
  list.forEach((r, i) => {
    if (!isObj(r) || !valid(r)) throw new BackupError(`Invalid ${name} record at position ${i + 1}`);
  });
  return list as T[];
}

/** Upgrades older backup formats to the current schema. */
function migrate(raw: Record<string, unknown>): Record<string, unknown> {
  const version = raw.schemaVersion as number;
  // Future: if (version === 1) { …transform to v2…; raw.schemaVersion = 2 }
  if (version > SCHEMA_VERSION) {
    throw new BackupError('This backup was made by a newer version of ShahiFit. Please update the app first.');
  }
  return raw;
}

export function validateBackup(input: unknown): BackupFile {
  if (!isObj(input) || input.app !== 'ShahiFit' || !Number.isInteger(input.schemaVersion) || !isObj(input.data)) {
    throw new BackupError('Not a ShahiFit backup file');
  }
  const raw = migrate(input);
  const data = raw.data as Record<string, unknown>;

  const foodEntries = check<FoodEntry>(arr(data, 'foodEntries'), 'food', (r) =>
    isStr(r.id) && isValidISODate(r.date) && MEAL_IDS.includes(r.meal as string) && typeof r.foodName === 'string' &&
    isNonNeg(r.quantity) && UNITS.includes(r.unit as string) && isNonNeg(r.calories) &&
    isNonNeg(r.protein) && isNonNeg(r.carbs) && isNonNeg(r.fat) && isNum(r.createdAt),
  );
  const savedFoods = check<SavedFood>(arr(data, 'savedFoods'), 'saved food', (r) =>
    isStr(r.id) && isStr(r.name) && isNonNeg(r.defaultQuantity) && UNITS.includes(r.unit as string) &&
    isNonNeg(r.calories) && isNonNeg(r.protein) && isNonNeg(r.carbs) && isNonNeg(r.fat),
  ).map((f) => ({ ...f, builtIn: !!f.builtIn, createdAt: f.createdAt ?? Date.now(), updatedAt: f.updatedAt ?? Date.now() }));
  const steps = check<StepEntry>(arr(data, 'steps'), 'steps', (r) =>
    isValidISODate(r.date) && r.id === r.date && isNonNeg(r.steps),
  );
  const workouts = check<Workout>(arr(data, 'workouts'), 'workout', (r) =>
    isStr(r.id) && isValidISODate(r.date) && isStr(r.workoutType) && typeof r.workoutName === 'string' &&
    Array.isArray(r.exercises) && isNonNeg(r.durationMinutes) && INTENSITY.includes(r.intensity as string) &&
    isObj(r.estimatedCalories) && isNonNeg((r.estimatedCalories as Record<string, unknown>).mid),
  );
  const weights = check<WeightEntry>(arr(data, 'weights'), 'weight', (r) =>
    isValidISODate(r.date) && r.id === r.date && isNum(r.weight) && (r.weight as number) > 0 &&
    (r.waist === undefined || isNonNeg(r.waist)),
  );
  const water = check<WaterEntry>(arr(data, 'water'), 'water', (r) =>
    isStr(r.id) && isValidISODate(r.date) && isNonNeg(r.amountMl),
  );
  let muscleGroups = check<MuscleGroup>(arr(data, 'muscleGroups'), 'muscle group', (r) =>
    isStr(r.id) && isStr(r.name) && Array.isArray(r.exercises) && r.exercises.every((e) => typeof e === 'string'),
  );
  let workoutTemplates = check<WorkoutTemplate>(arr(data, 'workoutTemplates'), 'workout template', (r) =>
    isStr(r.id) && isStr(r.name) && Array.isArray(r.groupIds),
  );
  if (muscleGroups.length === 0) muscleGroups = structuredClone(DEFAULT_MUSCLE_GROUPS);
  if (workoutTemplates.length === 0) workoutTemplates = structuredClone(DEFAULT_TEMPLATES);

  if (data.settings !== undefined && !isObj(data.settings)) throw new BackupError('Invalid settings');
  const s = { ...DEFAULT_SETTINGS, ...((data.settings as object) ?? {}), id: 'app' } as Settings;
  const numericKeys: (keyof Settings)[] = ['calorieTarget', 'proteinTarget', 'stepTarget', 'waterTarget', 'bodyWeight', 'height'];
  for (const k of numericKeys) if (!isNum(s[k]) || (s[k] as number) <= 0) throw new BackupError(`Invalid setting: ${k}`);
  if (!Array.isArray(s.schedule) || s.schedule.length !== 7) s.schedule = [...DEFAULT_SETTINGS.schedule];
  if (s.weeklyWorkoutTarget !== 4 && s.weeklyWorkoutTarget !== 5) s.weeklyWorkoutTarget = 5;

  return {
    app: 'ShahiFit',
    schemaVersion: SCHEMA_VERSION,
    exportedAt: typeof raw.exportedAt === 'string' ? raw.exportedAt : '',
    data: { foodEntries, savedFoods, steps, workouts, muscleGroups, workoutTemplates, weights, water, settings: s },
  };
}

export async function parseBackupFile(file: File): Promise<BackupFile> {
  if (file.size > 50 * 1024 * 1024) throw new BackupError('File is too large');
  let json: unknown;
  try {
    json = JSON.parse(await file.text());
  } catch {
    throw new BackupError('File is not valid JSON');
  }
  return validateBackup(json);
}

export function summarizeBackup(b: BackupFile) {
  return {
    foods: b.data.foodEntries.length,
    steps: b.data.steps.length,
    workouts: b.data.workouts.length,
    weights: b.data.weights.length,
    exportedAt: b.exportedAt,
  };
}

/* --------------------------------------------------------------- restore */

/** Replaces ALL current data with the backup contents, atomically. */
export async function restoreBackup(b: BackupFile): Promise<void> {
  await db.transaction('rw', ALL_TABLES(), async () => {
    await Promise.all(ALL_TABLES().map((t) => t.clear()));
    const d = b.data;
    await db.foodEntries.bulkAdd(d.foodEntries);
    await db.savedFoods.bulkAdd(d.savedFoods);
    await db.steps.bulkAdd(d.steps);
    await db.workouts.bulkAdd(d.workouts);
    await db.muscleGroups.bulkAdd(d.muscleGroups);
    await db.workoutTemplates.bulkAdd(d.workoutTemplates);
    await db.weights.bulkAdd(d.weights);
    await db.water.bulkAdd(d.water);
    await db.settings.put(d.settings);
  });
}

/** Deletes every record, then re-creates the built-in starter library and default settings. */
export async function deleteAllData(): Promise<void> {
  const seed = buildSeed();
  await db.transaction('rw', ALL_TABLES(), async () => {
    await Promise.all(ALL_TABLES().map((t) => t.clear()));
    await db.savedFoods.bulkAdd(seed.savedFoods);
    await db.muscleGroups.bulkAdd(seed.muscleGroups);
    await db.workoutTemplates.bulkAdd(seed.workoutTemplates);
    await db.settings.put(seed.settings);
  });
}
