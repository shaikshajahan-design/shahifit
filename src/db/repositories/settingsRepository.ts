import { db } from '../db';
import type { ScheduleMode, Settings, WeeklySchedule } from '../../types';
import { DEFAULT_SETTINGS } from '../../data/defaultSettings';
import { SCHEDULE_4_DAY, SCHEDULE_5_DAY } from '../../data/workoutTemplates';

export const settingsRepository = {
  async get(): Promise<Settings> {
    const s = await db.settings.get('app');
    // Merge with defaults so newly-added settings always have a value.
    return { ...DEFAULT_SETTINGS, ...(s ?? {}) } as Settings;
  },

  async update(changes: Partial<Omit<Settings, 'id'>>): Promise<void> {
    const current = await settingsRepository.get();
    await db.settings.put({ ...current, ...changes, id: 'app' });
  },

  async applySchedulePreset(mode: Exclude<ScheduleMode, 'custom'>): Promise<void> {
    const schedule = [...(mode === '5day' ? SCHEDULE_5_DAY : SCHEDULE_4_DAY)] as WeeklySchedule;
    await settingsRepository.update({ scheduleMode: mode, schedule });
  },

  async setScheduleDay(dayIndex: number, slot: string): Promise<void> {
    const current = await settingsRepository.get();
    const schedule = [...current.schedule] as WeeklySchedule;
    schedule[dayIndex] = slot;
    await settingsRepository.update({ schedule, scheduleMode: 'custom' });
  },
};
