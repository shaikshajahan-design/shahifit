import 'fake-indexeddb/auto';
import { beforeAll, describe, expect, it } from 'vitest';
import { db } from '../db/db';
import { foodRepository } from '../db/repositories/foodRepository';
import { stepRepository } from '../db/repositories/stepRepository';
import { workoutRepository } from '../db/repositories/workoutRepository';
import { weightRepository } from '../db/repositories/weightRepository';
import { settingsRepository } from '../db/repositories/settingsRepository';
import { BackupError, createBackup, deleteAllData, restoreBackup, validateBackup } from './backupService';

beforeAll(async () => {
  await db.open();
});

describe('database + backup', () => {
  it('seeds starter foods, templates and settings on first open', async () => {
    expect(await db.savedFoods.count()).toBe(10);
    expect(await db.workoutTemplates.count()).toBe(8);
    expect((await settingsRepository.get()).calorieTarget).toBe(2300);
    expect(await db.foodEntries.count()).toBe(0); // no fake history
  });

  it('export → delete all → restore round-trips every record', async () => {
    await foodRepository.add({
      date: '2026-09-28', meal: 'lunch', foodName: 'Chicken Breast', quantity: 200, unit: 'g',
      calories: 330, protein: 62, carbs: 0, fat: 7,
    });
    await foodRepository.addQuick('2026-09-27', 'dinner', 650);
    await stepRepository.set('2026-09-28', 8742);
    await workoutRepository.add({
      date: '2026-09-28', workoutType: 'chest-triceps', workoutName: 'Chest + Triceps',
      exercises: [{ name: 'Bench Press', group: 'Chest' }], durationMinutes: 72, intensity: 'moderate',
      estimatedCalories: { low: 300, mid: 380, high: 450 }, completed: true,
    });
    await weightRepository.upsert('2026-09-28', 104.6, 102);
    expect((await settingsRepository.get()).bodyWeight).toBe(104.6);

    const backup = JSON.parse(JSON.stringify(await createBackup()));
    expect(backup.schemaVersion).toBe(1);

    await deleteAllData();
    expect(await db.foodEntries.count()).toBe(0);
    expect(await db.steps.count()).toBe(0);
    expect(await db.savedFoods.count()).toBe(10); // starter library restored

    await restoreBackup(validateBackup(backup));
    expect(await db.foodEntries.count()).toBe(2);
    expect((await stepRepository.get('2026-09-28'))?.steps).toBe(8742);
    expect(await db.workouts.count()).toBe(1);
    expect((await weightRepository.get('2026-09-28'))?.waist).toBe(102);
    expect((await settingsRepository.get()).bodyWeight).toBe(104.6);
  });

  it('recent foods are distinct and skip quick entries', async () => {
    const r = await foodRepository.recent();
    expect(r.map((x) => x.name)).toEqual(['Chicken Breast']);
  });

  it('rejects invalid backups', () => {
    expect(() => validateBackup({ hello: 1 })).toThrow(BackupError);
    expect(() =>
      validateBackup({ app: 'ShahiFit', schemaVersion: 1, data: { steps: [{ id: 'x', date: 'bad', steps: -5 }] } }),
    ).toThrow(BackupError);
    expect(() => validateBackup({ app: 'ShahiFit', schemaVersion: 99, data: {} })).toThrow(/newer version/);
  });
});
