import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { ISODate } from '../types';
import { addDays, todayISO } from '../utils/date';

interface DateCtx {
  selectedDate: ISODate;
  today: ISODate;
  isToday: boolean;
  setSelectedDate: (d: ISODate) => void;
  shiftDay: (delta: number) => void;
  goToday: () => void;
}

const Ctx = createContext<DateCtx | null>(null);

export function SelectedDateProvider({ children }: { children: ReactNode }) {
  const [today, setToday] = useState(todayISO);
  const [selectedDate, setSelected] = useState(todayISO);

  // Keep "today" correct if the app stays open past midnight or is resumed the next day.
  useEffect(() => {
    const refresh = () => {
      const t = todayISO();
      setToday((prev) => {
        if (prev !== t) {
          // If the user was looking at "today", follow it to the new day.
          setSelected((sel) => (sel === prev ? t : sel));
        }
        return t;
      });
    };
    const timer = window.setInterval(refresh, 60_000);
    document.addEventListener('visibilitychange', refresh);
    window.addEventListener('focus', refresh);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', refresh);
      window.removeEventListener('focus', refresh);
    };
  }, []);

  const setSelectedDate = useCallback((d: ISODate) => setSelected(d > today ? today : d), [today]);
  const shiftDay = useCallback(
    (delta: number) => setSelected((cur) => {
      const next = addDays(cur, delta);
      return next > today ? cur : next;
    }),
    [today],
  );
  const goToday = useCallback(() => setSelected(today), [today]);

  const value = useMemo(
    () => ({ selectedDate, today, isToday: selectedDate === today, setSelectedDate, shiftDay, goToday }),
    [selectedDate, today, setSelectedDate, shiftDay, goToday],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useSelectedDate(): DateCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useSelectedDate must be used inside SelectedDateProvider');
  return ctx;
}
