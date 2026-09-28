import type { WeightEntry } from '../../types';
import { addDays } from '../../utils/date';

/** Latest entry on or before `date` (entries sorted ascending by date). */
function entryOnOrBefore(sorted: WeightEntry[], date: string): WeightEntry | undefined {
  for (let i = sorted.length - 1; i >= 0; i--) if (sorted[i].date <= date) return sorted[i];
  return undefined;
}

/**
 * Current weight and change over 7/30 days.
 * The comparison point is the most recent entry on or before (latest date − N days).
 */
export function weightTrend(entries: WeightEntry[]) {
  const sorted = [...entries].sort((a, b) => (a.date < b.date ? -1 : 1));
  const latest = sorted[sorted.length - 1];
  if (!latest) return { current: null, change7: null, change30: null, latestDate: null };
  const ref7 = entryOnOrBefore(sorted, addDays(latest.date, -7));
  const ref30 = entryOnOrBefore(sorted, addDays(latest.date, -30));
  return {
    current: latest.weight,
    latestDate: latest.date,
    change7: ref7 ? latest.weight - ref7.weight : null,
    change30: ref30 ? latest.weight - ref30.weight : null,
  };
}
