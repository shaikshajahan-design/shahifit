import { db } from '../db';
import type { ISODate, MuscleGroup, Workout, WorkoutTemplate } from '../../types';
import { newId } from '../../utils/id';

export type NewWorkout = Omit<Workout, 'id' | 'createdAt'>;

export const workoutRepository = {
  forDate(date: ISODate): Promise<Workout[]> {
    return db.workouts.where('date').equals(date).sortBy('createdAt');
  },

  inRange(from: ISODate, to: ISODate): Promise<Workout[]> {
    return db.workouts.where('date').between(from, to, true, true).sortBy('date');
  },

  async recent(limit = 10): Promise<Workout[]> {
    const all = await db.workouts.orderBy('date').reverse().limit(limit * 2).toArray();
    return all
      .sort((a, b) => (a.date === b.date ? b.createdAt - a.createdAt : a.date < b.date ? 1 : -1))
      .slice(0, limit);
  },

  get(id: string): Promise<Workout | undefined> {
    return db.workouts.get(id);
  },

  async add(workout: NewWorkout): Promise<string> {
    const id = newId();
    await db.workouts.add({ ...workout, id, createdAt: Date.now() });
    return id;
  },

  async update(id: string, changes: Partial<NewWorkout>): Promise<void> {
    await db.workouts.update(id, changes);
  },

  async remove(id: string): Promise<Workout | undefined> {
    const existing = await db.workouts.get(id);
    await db.workouts.delete(id);
    return existing;
  },

  async restore(w: Workout): Promise<void> {
    await db.workouts.put(w);
  },

  templates(): Promise<WorkoutTemplate[]> {
    return db.workoutTemplates.orderBy('order').toArray();
  },

  muscleGroups(): Promise<MuscleGroup[]> {
    return db.muscleGroups.toArray();
  },

  async addExercise(groupId: string, name: string): Promise<void> {
    const clean = name.trim();
    if (!clean) return;
    await db.transaction('rw', db.muscleGroups, async () => {
      const g = await db.muscleGroups.get(groupId);
      if (!g) return;
      if (g.exercises.some((e) => e.toLowerCase() === clean.toLowerCase())) return;
      await db.muscleGroups.update(groupId, { exercises: [...g.exercises, clean] });
    });
  },

  async removeExercise(groupId: string, name: string): Promise<void> {
    await db.transaction('rw', db.muscleGroups, async () => {
      const g = await db.muscleGroups.get(groupId);
      if (!g) return;
      await db.muscleGroups.update(groupId, { exercises: g.exercises.filter((e) => e !== name) });
    });
  },
};
