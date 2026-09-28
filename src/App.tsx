import { useCallback, useRef, useState } from 'react';
import type { TabId } from './types';
import { AppHeader } from './components/AppHeader';
import { DateSelector } from './components/DateSelector';
import { DaySummary } from './components/DaySummary';
import { UpdatePrompt } from './components/UpdatePrompt';
import { TabPanel } from './pages/TabPanel';
import { WeightSheet } from './features/weight/WeightSheet';
import { SettingsSheet } from './features/settings/SettingsSheet';
import { useSettings } from './hooks/useData';
import { useSelectedDate } from './hooks/useSelectedDate';
import { useTheme } from './hooks/useTheme';
import { readPref, writePref } from './utils/safeStorage';

const isTab = (v: string | null): v is TabId => v === 'food' || v === 'steps' || v === 'gym';

export default function App() {
  const settings = useSettings();
  useTheme(settings.theme);
  const { shiftDay } = useSelectedDate();

  const [tab, setTabState] = useState<TabId>(() => {
    const saved = readPref('lastTab');
    return isTab(saved) ? saved : 'food';
  });
  const [weightOpen, setWeightOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const setTab = useCallback((t: TabId) => {
    setTabState(t);
    writePref('lastTab', t);
    window.scrollTo({ top: 0 });
  }, []);

  // Horizontal swipe on the content changes the day (ignored on charts, inputs and scrollers).
  const touch = useRef<{ x: number; y: number; t: number } | null>(null);
  const onTouchStart = (e: React.TouchEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('.chart, input, select, textarea, .no-swipe, .chip-row')) {
      touch.current = null;
      return;
    }
    const p = e.touches[0];
    touch.current = { x: p.clientX, y: p.clientY, t: Date.now() };
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    const start = touch.current;
    touch.current = null;
    if (!start) return;
    const p = e.changedTouches[0];
    const dx = p.clientX - start.x;
    const dy = p.clientY - start.y;
    if (Math.abs(dx) > 70 && Math.abs(dy) < 45 && Date.now() - start.t < 600) shiftDay(dx > 0 ? -1 : 1);
  };

  return (
    <div className="app">
      <AppHeader tab={tab} onTabChange={setTab} onOpenWeight={() => setWeightOpen(true)} onOpenSettings={() => setSettingsOpen(true)} />
      <main className="main" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
        <DateSelector />
        <DaySummary onJump={setTab} />
        <TabPanel tab={tab} />
      </main>
      <WeightSheet open={weightOpen} onClose={() => setWeightOpen(false)} />
      <SettingsSheet open={settingsOpen} onClose={() => setSettingsOpen(false)} />
      <UpdatePrompt />
    </div>
  );
}
