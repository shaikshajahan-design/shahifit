/** Local calendar date, always formatted as YYYY-MM-DD (no time zone). */
export type ISODate = string;

export type TabId = 'food' | 'steps' | 'gym';

export type MealId = 'breakfast' | 'lunch' | 'snacks' | 'dinner';

export type FoodUnit = 'g' | 'ml' | 'piece' | 'cup' | 'bowl' | 'serving' | 'tbsp';

export interface FoodEntry {
  id: string;
  date: ISODate;
  meal: MealId;
  foodName: string;
  quantity: number;
  unit: FoodUnit;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  /** true when added via Quick Calories (no macros) */
  quick?: boolean;
  createdAt: number;
}

export interface SavedFood {
  id: string;
  name: string;
  defaultQuantity: number;
  unit: FoodUnit;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  /** Built-in starter food (seed data), as opposed to one the user created. */
  builtIn: boolean;
  createdAt: number;
  updatedAt: number;
}

/** A food the user can pick from Recent or My Foods — nutrition is for `quantity`. */
export interface FoodTemplate {
  name: string;
  quantity: number;
  unit: FoodUnit;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface StepEntry {
  /** one record per day; id === date */
  id: ISODate;
  date: ISODate;
  steps: number;
  updatedAt: number;
}

export type Intensity = 'light' | 'moderate' | 'hard';
export type WorkoutKind = 'strength' | 'cardio';

export interface MuscleGroup {
  id: string;
  name: string;
  exercises: string[];
}

export interface WorkoutTemplate {
  id: string;
  name: string;
  groupIds: string[];
  kind: WorkoutKind;
  /** Optional templates are shown in a secondary row */
  optional: boolean;
  order: number;
}

export interface WorkoutExercise {
  name: string;
  group: string;
}

export interface CalorieEstimate {
  low: number;
  high: number;
  mid: number;
}

export interface Workout {
  id: string;
  date: ISODate;
  /** WorkoutTemplate id */
  workoutType: string;
  /** Snapshot of the template name at the time of logging */
  workoutName: string;
  exercises: WorkoutExercise[];
  durationMinutes: number;
  intensity: Intensity;
  estimatedCalories: CalorieEstimate;
  completed: boolean;
  createdAt: number;
}

export interface WeightEntry {
  /** one record per day; id === date */
  id: ISODate;
  date: ISODate;
  weight: number;
  waist?: number;
}

export interface WaterEntry {
  id: string;
  date: ISODate;
  amountMl: number;
  createdAt: number;
}

export type ThemePref = 'system' | 'light' | 'dark';
export type ScheduleMode = '5day' | '4day' | 'custom';
/** Template id, or 'rest' / 'optional' */
export type ScheduleSlot = string;
/** index 0 = Monday … 6 = Sunday */
export type WeeklySchedule = [
  ScheduleSlot,
  ScheduleSlot,
  ScheduleSlot,
  ScheduleSlot,
  ScheduleSlot,
  ScheduleSlot,
  ScheduleSlot,
];

export interface Settings {
  id: 'app';
  calorieTarget: number;
  proteinTarget: number;
  stepTarget: number;
  waterTarget: number;
  weeklyWorkoutTarget: 4 | 5;
  bodyWeight: number;
  height: number;
  weightUnit: 'kg';
  theme: ThemePref;
  scheduleMode: ScheduleMode;
  schedule: WeeklySchedule;
  lastBackupAt: number | null;
}

export interface BackupFile {
  app: 'ShahiFit';
  schemaVersion: number;
  exportedAt: string;
  data: {
    foodEntries: FoodEntry[];
    savedFoods: SavedFood[];
    steps: StepEntry[];
    workouts: Workout[];
    muscleGroups: MuscleGroup[];
    workoutTemplates: WorkoutTemplate[];
    weights: WeightEntry[];
    water: WaterEntry[];
    settings: Settings;
  };
}
