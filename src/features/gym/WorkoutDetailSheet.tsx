import { Pencil } from 'lucide-react';
import type { Workout } from '../../types';
import { BottomSheet } from '../../components/BottomSheet';
import { formatLongDate } from '../../utils/date';
import { WorkoutSummary } from './WorkoutSummary';

interface Props {
  workout: Workout | null;
  onClose: () => void;
  onEdit: (w: Workout) => void;
}

export function WorkoutDetailSheet({ workout, onClose, onEdit }: Props) {
  if (!workout) return null;
  return (
    <BottomSheet
      open={!!workout}
      onClose={onClose}
      title={workout.workoutName}
      subtitle={formatLongDate(workout.date)}
      footer={
        <button type="button" className="btn btn-secondary btn-block" onClick={() => onEdit(workout)}>
          <Pencil size={17} aria-hidden="true" /> Edit or delete
        </button>
      }
    >
      <WorkoutSummary workout={workout} />
    </BottomSheet>
  );
}
