import { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import { Scale, Trash2 } from 'lucide-react';
import { BottomSheet } from '../../components/BottomSheet';
import { EmptyState } from '../../components/EmptyState';
import { Field } from '../../components/Field';
import { useToast } from '../../components/Toast';
import { useWeights } from '../../hooks/useData';
import { useSelectedDate } from '../../hooks/useSelectedDate';
import { weightRepository } from '../../db/repositories/weightRepository';
import { LIMITS } from '../../data/defaultSettings';
import { weightTrend } from '../../services/calculations/weight';
import { addDays, formatShortDate, isValidISODate } from '../../utils/date';
import { fmt1, fmtSigned, parseNumber } from '../../utils/format';

const WeightLineChart = lazy(() => import('../../components/charts/WeightLineChart'));

export function WeightSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { selectedDate, today } = useSelectedDate();
  const toast = useToast();
  const entries = useWeights();
  const [date, setDate] = useState(selectedDate);
  const [weight, setWeight] = useState('');
  const [waist, setWaist] = useState('');
  const [errors, setErrors] = useState<{ weight?: string; waist?: string; date?: string }>({});
  const [showAll, setShowAll] = useState(false);

  const list = entries ?? [];
  const trend = useMemo(() => weightTrend(list), [list]);
  const recent = useMemo(() => {
    const from = addDays(today, -90);
    const r = list.filter((e) => e.date >= from);
    return r.length >= 2 ? r : list.slice(-12);
  }, [list, today]);
  const history = useMemo(() => [...list].reverse(), [list]);
  const existing = list.find((e) => e.date === date);

  useEffect(() => {
    if (open) {
      setDate(selectedDate);
      setErrors({});
      setShowAll(false);
    }
  }, [open, selectedDate]);

  // Prefill when the chosen date already has an entry.
  useEffect(() => {
    if (!open) return;
    setWeight(existing ? String(existing.weight) : '');
    setWaist(existing?.waist ? String(existing.waist) : '');
  }, [open, date, existing?.weight, existing?.waist]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: typeof errors = {};
    const w = parseNumber(weight);
    if (!(w >= LIMITS.bodyWeight.min && w <= LIMITS.bodyWeight.max)) errs.weight = 'Please enter a valid weight in kg.';
    let wa: number | undefined;
    if (waist.trim()) {
      wa = parseNumber(waist);
      if (!(wa >= LIMITS.waist.min && wa <= LIMITS.waist.max)) errs.waist = 'Enter waist in cm (or leave empty).';
    }
    if (!isValidISODate(date) || date > today) errs.date = 'Choose a valid date (not in the future).';
    setErrors(errs);
    if (Object.keys(errs).length) return;
    await weightRepository.upsert(date, Math.round(w * 10) / 10, wa ? Math.round(wa * 10) / 10 : undefined);
    toast({ message: `${existing ? 'Updated' : 'Saved'} ${fmt1(w)} kg for ${formatShortDate(date)}` });
  };

  const remove = async (d: string) => {
    const removed = await weightRepository.remove(d);
    if (removed) toast({ message: 'Weight entry deleted', actionLabel: 'Undo', onAction: () => void weightRepository.restore(removed) });
  };

  const change = (v: number | null) =>
    v === null ? <span className="muted">—</span> : <>{fmtSigned(v)} <small>kg</small></>;

  return (
    <BottomSheet open={open} onClose={onClose} title="Weight" subtitle="Track body weight and waist" size="tall">
      {list.length === 0 ? (
        <EmptyState compact icon={<Scale size={24} />} title="No weight recorded yet" text="Add your first weigh-in below. It also keeps calorie estimates accurate." />
      ) : (
        <>
          <dl className="mini-stats mini-stats-3">
            <div>
              <dt>Current</dt>
              <dd>
                {fmt1(trend.current!)} <small>kg</small>
              </dd>
            </div>
            <div>
              <dt>7-day change</dt>
              <dd>{change(trend.change7)}</dd>
            </div>
            <div>
              <dt>30-day change</dt>
              <dd>{change(trend.change30)}</dd>
            </div>
          </dl>
          {recent.length >= 2 && (
            <Suspense fallback={<div className="chart-skeleton" aria-hidden="true" />}>
              <WeightLineChart entries={recent} />
            </Suspense>
          )}
        </>
      )}

      <form className="form sheet-section card-inset" onSubmit={save} noValidate>
        <h3 className="section-label">{existing ? 'Update entry' : 'Add entry'}</h3>
        <div className="field-grid">
          <Field label="Weight" value={weight} onChange={(v) => { setWeight(v); setErrors((e) => ({ ...e, weight: undefined })); }} error={errors.weight} numeric="decimal" suffix="kg" placeholder="e.g. 104.6" />
          <Field label="Waist (optional)" value={waist} onChange={(v) => { setWaist(v); setErrors((e) => ({ ...e, waist: undefined })); }} error={errors.waist} numeric="decimal" suffix="cm" />
        </div>
        <Field label="Date" type="date" value={date} max={today} onChange={setDate} error={errors.date} />
        <button type="submit" className="btn btn-primary btn-block">
          {existing ? 'Update weight' : 'Save weight'}
        </button>
      </form>

      {history.length > 0 && (
        <div className="sheet-section">
          <h3 className="section-label">History</h3>
          <ul className="list">
            {(showAll ? history : history.slice(0, 8)).map((e) => (
              <li key={e.date} className="simple-row">
                <span className="simple-date">{formatShortDate(e.date)}</span>
                <span className="simple-val">
                  <strong>{fmt1(e.weight)}</strong> kg{e.waist ? <span className="muted"> · waist {fmt1(e.waist)} cm</span> : null}
                </span>
                <button type="button" className="icon-btn icon-btn-muted" onClick={() => void remove(e.date)} aria-label={`Delete weight for ${formatShortDate(e.date)}`}>
                  <Trash2 size={17} />
                </button>
              </li>
            ))}
          </ul>
          {history.length > 8 && (
            <button type="button" className="btn btn-ghost btn-block" onClick={() => setShowAll((v) => !v)}>
              {showAll ? 'Show less' : `Show all ${history.length}`}
            </button>
          )}
        </div>
      )}
    </BottomSheet>
  );
}
