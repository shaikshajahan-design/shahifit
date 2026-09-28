import { useState } from 'react';
import { Check, Plus, X } from 'lucide-react';
import type { MuscleGroup } from '../../types';
import { workoutRepository } from '../../db/repositories/workoutRepository';

interface Props {
  group: MuscleGroup;
  selected: Set<string>;
  onToggle: (name: string) => void;
  onAdded: (name: string) => void;
}

/** Large-tap checklist for one muscle group, with add / remove of custom exercises. */
export function ExerciseChecklist({ group, selected, onToggle, onAdded }: Props) {
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState('');
  const count = group.exercises.filter((e) => selected.has(e)).length;

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = name.trim();
    if (!clean) return;
    await workoutRepository.addExercise(group.id, clean);
    onAdded(clean);
    setName('');
    setAdding(false);
  };

  return (
    <fieldset className="checklist">
      <legend className="checklist-head">
        <span className="checklist-title">{group.name}</span>
        <span className="checklist-count">
          {count} of {group.exercises.length}
        </span>
      </legend>
      <ul className="checklist-items">
        {group.exercises.map((ex) => {
          const on = selected.has(ex);
          return (
            <li key={ex} className="check-item-row">
              <label className={`check-item ${on ? 'on' : ''}`}>
                <input type="checkbox" checked={on} onChange={() => onToggle(ex)} />
                <span className="check-box" aria-hidden="true">
                  {on && <Check size={16} strokeWidth={3} />}
                </span>
                <span className="check-text">{ex}</span>
              </label>
              {editing && (
                <button
                  type="button"
                  className="icon-btn icon-btn-muted"
                  aria-label={`Remove ${ex} from ${group.name} list`}
                  onClick={() => {
                    if (on) onToggle(ex);
                    void workoutRepository.removeExercise(group.id, ex);
                  }}
                >
                  <X size={17} />
                </button>
              )}
            </li>
          );
        })}
      </ul>
      {adding ? (
        <form className="add-inline" onSubmit={add}>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={`New ${group.name.toLowerCase()} exercise`}
            aria-label={`New ${group.name} exercise name`}
            maxLength={40}
            autoFocus
          />
          <button type="submit" className="btn btn-primary btn-sm" disabled={!name.trim()}>
            Add
          </button>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setAdding(false)}>
            Cancel
          </button>
        </form>
      ) : (
        <div className="checklist-actions">
          <button type="button" className="link-btn" onClick={() => setAdding(true)}>
            <Plus size={15} aria-hidden="true" /> Add exercise
          </button>
          <button type="button" className="link-btn muted" onClick={() => setEditing((v) => !v)} aria-pressed={editing}>
            {editing ? 'Done' : 'Edit list'}
          </button>
        </div>
      )}
    </fieldset>
  );
}
