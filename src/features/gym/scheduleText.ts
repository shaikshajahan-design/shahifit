import type { WorkoutTemplate } from '../../types';
import { OPTIONAL, REST } from '../../data/workoutTemplates';

export function slotLabel(slot: string, templates: WorkoutTemplate[]): string {
  if (slot === REST) return 'Rest';
  if (slot === OPTIONAL) return 'Rest / Optional';
  return templates.find((t) => t.id === slot)?.name ?? 'Rest';
}

export function isWorkoutSlot(slot: string) {
  return slot !== REST && slot !== OPTIONAL;
}
