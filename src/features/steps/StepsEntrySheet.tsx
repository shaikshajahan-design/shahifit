import { useEffect, useState } from 'react';
import { Trash2 } from 'lucide-react';
import type { StepEntry } from '../../types';
import { BottomSheet } from '../../components/BottomSheet';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { Field } from '../../components/Field';
import { useToast } from '../../components/Toast';
import { useSelectedDate } from '../../hooks/useSelectedDate';
import { stepRepository } from '../../db/repositories/stepRepository';
import { LIMITS } from '../../data/defaultSettings';
import { formatLongDate } from '../../utils/date';
import { fmtInt, parseNumber } from '../../utils/format';

interface Props {
  open: boolean;
  onClose: () => void;
  current: StepEntry | null;
}

export function StepsEntrySheet({ open, onClose, current }: Props) {
  const { selectedDate } = useSelectedDate();
  const toast = useToast();
  const [value, setValue] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [confirm, setConfirm] = useState(false);

  useEffect(() => {
    if (open) {
      setValue(current ? String(current.steps) : '');
      setError(null);
    }
  }, [open, current]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const n = parseNumber(value);
    if (Number.isNaN(n)) return setError('Please enter a valid step count.');
    if (n < 0) return setError('Steps cannot be negative.');
    if (!Number.isInteger(n)) return setError('Steps must be a whole number.');
    if (n > LIMITS.steps.max) return setError(`That looks too high (max ${fmtInt(LIMITS.steps.max)}).`);
    await stepRepository.set(selectedDate, n);
    toast({ message: `Saved ${fmtInt(n)} steps` });
    onClose();
  };

  const remove = async () => {
    setConfirm(false);
    const removed = await stepRepository.remove(selectedDate);
    if (removed) toast({ message: 'Steps removed', actionLabel: 'Undo', onAction: () => void stepRepository.restore(removed) });
    onClose();
  };

  return (
    <>
      <BottomSheet
        open={open}
        onClose={onClose}
        title={current ? 'Update steps' : 'Enter steps'}
        subtitle={formatLongDate(selectedDate)}
        headerAction={
          current ? (
            <button type="button" className="icon-btn icon-btn-danger" onClick={() => setConfirm(true)} aria-label="Delete steps for this day">
              <Trash2 size={19} />
            </button>
          ) : undefined
        }
        footer={
          <button type="submit" form="steps-form" className="btn btn-primary btn-block btn-lg">
            Save steps
          </button>
        }
      >
        <form id="steps-form" className="form" onSubmit={submit} noValidate>
          <Field
            label="Total steps for the day"
            value={value}
            onChange={(v) => {
              setValue(v);
              setError(null);
            }}
            error={error}
            numeric="numeric"
            placeholder="e.g. 8742"
            className="field-xl"
            hint="Copy the day's total from your phone's step counter. This replaces any earlier value."
            autoFocus
          />
        </form>
      </BottomSheet>
      <ConfirmDialog
        open={confirm}
        title="Delete steps?"
        message={`Remove the step count for ${formatLongDate(selectedDate)}?`}
        confirmLabel="Delete"
        destructive
        onConfirm={() => void remove()}
        onCancel={() => setConfirm(false)}
      />
    </>
  );
}
