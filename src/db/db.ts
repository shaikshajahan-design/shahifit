import Dexie, { type EntityTable } from 'dexie';
import type {
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
import { DEFAULT_FOODS } from '../data/defaultFoods';
import { DEFAULT_MUSCLE_GROUPS, DEFAULT_TEMPLATES } from '../data/workoutTemplates';
import { DEFAULT_SETTINGS } from '../data/defaultSettings';
import { newId } from '../utils/id';

export class ShahiFitDB extends Dexie {
  foodEntries!: EntityTable<FoodEntry, 'id'>;
  savedFoods!: EntityTable<SavedFood, 'id'>;
  steps!: EntityTable<StepEntry, 'id'>;
  workouts!: EntityTable<Workout, 'id'>;
  muscleGroups!: EntityTable<MuscleGroup, 'id'>;
  workoutTemplates!: EntityTable<WorkoutTemplate, 'id'>;
  weights!: EntityTable<WeightEntry, 'id'>;
  water!: EntityTable<WaterEntry, 'id'>;
  settings!: EntityTable<Settings, 'id'>;

  constructor(name = 'shahifit') {
    super(name);
    // Schema version 1. Add new versions below (this.version(2)…) for future migrations.
    this.version(1).stores({
      foodEntries: 'id, date, createdAt, foodName',
      savedFoods: 'id, name',
      steps: 'id, date',
      workouts: 'id, date, createdAt',
      muscleGroups: 'id',
      workoutTemplates: 'id, order',
      weights: 'id, date',
      water: 'id, date',
      settings: 'id',
    });

    this.on('populate', (tx) => {
      const now = Date.now();
      tx.table('savedFoods').bulkAdd(
        DEFAULT_FOODS.map((f, i) => ({
          id: newId(),
          name: f.name,
          defaultQuantity: f.quantity,
          unit: f.unit,
          calories: f.calories,
          protein: f.protein,
          carbs: f.carbs,
          fat: f.fat,
          builtIn: true,
          createdAt: now + i,
          updatedAt: now + i,
        })),
      );
      tx.table('muscleGroups').bulkAdd(structuredClone(DEFAULT_MUSCLE_GROUPS));
      tx.table('workoutTemplates').bulkAdd(structuredClone(DEFAULT_TEMPLATES));
      tx.table('settings').add(structuredClone(DEFAULT_SETTINGS));
    });
  }
}

export const db = new ShahiFitDB();

/** Build the seed rows (used after "Delete all data" to restore the starter library). */
export function buildSeed() {
  const now = Date.now();
  return {
    savedFoods: DEFAULT_FOODS.map<SavedFood>((f, i) => ({
      id: newId(),
      name: f.name,
      defaultQuantity: f.quantity,
      unit: f.unit,
      calories: f.calories,
      protein: f.protein,
      carbs: f.carbs,
      fat: f.fat,
      builtIn: true,
      createdAt: now + i,
      updatedAt: now + i,
    })),
    muscleGroups: structuredClone(DEFAULT_MUSCLE_GROUPS),
    workoutTemplates: structuredClone(DEFAULT_TEMPLATES),
    settings: structuredClone(DEFAULT_SETTINGS),
  };
}

export const ALL_TABLES = () => [
  db.foodEntries,
  db.savedFoods,
  db.steps,
  db.workouts,
  db.muscleGroups,
  db.workoutTemplates,
  db.weights,
  db.water,
  db.settings,
];
