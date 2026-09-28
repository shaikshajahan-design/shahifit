import { Droplet, Undo2 } from 'lucide-react';
import { ProgressBar } from '../../components/ProgressBar';
import { useSettings, useWaterTotal } from '../../hooks/useData';
import { useSelectedDate } from '../../hooks/useSelectedDate';
import { waterRepository } from '../../db/repositories/waterRepository';
import { WATER_QUICK_ADD } from '../../data/constants';
import { fmtLitres } from '../../utils/format';

/** Small supporting water tracker — intentionally compact. */
export function WaterCard() {
  const { selectedDate } = useSelectedDate();
  const { waterTarget } = useSettings();
  const total = useWaterTotal(selectedDate);
  const done = total >= waterTarget;

  return (
    <section className="card water" aria-label="Water">
      <div className="water-head">
        <span className="water-title">
          <Droplet size={17} aria-hidden="true" /> Water
        </span>
        <span className="water-value">
          <strong>{fmtLitres(total)}</strong> / {fmtLitres(waterTarget)} L {done && <span className="ok-mark">✓</span>}
        </span>
      </div>
      <ProgressBar value={total} max={waterTarget} label="Water intake" size="sm" tone={done ? 'success' : 'accent'} />
      <div className="water-actions">
        {WATER_QUICK_ADD.map((ml) => (
          <button key={ml} type="button" className="chip" onClick={() => void waterRepository.add(selectedDate, ml)}>
            +{ml} ml
          </button>
        ))}
        <button
          type="button"
          className="icon-btn icon-btn-muted"
          onClick={() => void waterRepository.undoLast(selectedDate)}
          disabled={total === 0}
          aria-label="Undo last water entry"
        >
          <Undo2 size={18} />
        </button>
      </div>
    </section>
  );
}
