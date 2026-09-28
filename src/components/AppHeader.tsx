import { Scale, Settings as SettingsIcon } from 'lucide-react';
import type { TabId } from '../types';
import { TabNav } from './TabNav';

interface Props {
  tab: TabId;
  onTabChange: (t: TabId) => void;
  onOpenWeight: () => void;
  onOpenSettings: () => void;
}

export function AppHeader({ tab, onTabChange, onOpenWeight, onOpenSettings }: Props) {
  return (
    <header className="app-header">
      <div className="app-bar">
        <div className="brand">
          <svg className="brand-mark" viewBox="0 0 32 32" aria-hidden="true">
            <rect width="32" height="32" rx="9" className="brand-mark-bg" />
            <path
              d="M6 17.5h4.2l2.6-6.5 4.4 11 3-7.2 1.4 2.7H26"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span className="brand-name">ShahiFit</span>
        </div>
        <div className="app-bar-actions">
          <button type="button" className="icon-btn" onClick={onOpenWeight} aria-label="Weight tracking">
            <Scale size={21} />
          </button>
          <button type="button" className="icon-btn" onClick={onOpenSettings} aria-label="Settings">
            <SettingsIcon size={21} />
          </button>
        </div>
      </div>
      <TabNav tab={tab} onChange={onTabChange} />
    </header>
  );
}
