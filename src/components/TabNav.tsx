import { Dumbbell, Footprints, UtensilsCrossed } from 'lucide-react';
import type { TabId } from '../types';

const TABS: { id: TabId; label: string; Icon: typeof Dumbbell }[] = [
  { id: 'food', label: 'Food', Icon: UtensilsCrossed },
  { id: 'steps', label: 'Steps', Icon: Footprints },
  { id: 'gym', label: 'Gym', Icon: Dumbbell },
];

export function TabNav({ tab, onChange }: { tab: TabId; onChange: (t: TabId) => void }) {
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    const i = TABS.findIndex((t) => t.id === tab);
    const next = TABS[(i + (e.key === 'ArrowRight' ? 1 : TABS.length - 1)) % TABS.length];
    onChange(next.id);
    document.getElementById(`tab-${next.id}`)?.focus();
  };
  return (
    <nav className="tabs" role="tablist" aria-label="Sections" onKeyDown={onKeyDown}>
      {TABS.map(({ id, label, Icon }) => {
        const active = id === tab;
        return (
          <button
            key={id}
            id={`tab-${id}`}
            type="button"
            role="tab"
            aria-selected={active}
            aria-controls="tab-panel"
            tabIndex={active ? 0 : -1}
            className={`tab ${active ? 'active' : ''}`}
            onClick={() => onChange(id)}
          >
            <Icon size={18} strokeWidth={active ? 2.4 : 2} aria-hidden="true" />
            <span>{label}</span>
          </button>
        );
      })}
    </nav>
  );
}
