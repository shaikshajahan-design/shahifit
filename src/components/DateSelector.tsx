import { useRef } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import { useSelectedDate } from '../hooks/useSelectedDate';
import { formatLongDate, isValidISODate, relativeDayLabel } from '../utils/date';

export function DateSelector() {
  const { selectedDate, today, isToday, shiftDay, setSelectedDate, goToday } = useSelectedDate();
  const pickerRef = useRef<HTMLInputElement>(null);

  const openPicker = () => {
    const el = pickerRef.current;
    if (!el) return;
    try {
      el.showPicker();
    } catch {
      el.focus();
      el.click();
    }
  };

  return (
    <div className="date-selector">
      <button type="button" className="icon-btn" onClick={() => shiftDay(-1)} aria-label="Previous day">
        <ChevronLeft size={22} />
      </button>

      <div className="date-center">
        <button type="button" className="date-button" onClick={openPicker} aria-label={`Selected date ${formatLongDate(selectedDate)}. Choose a date`}>
          <span className="date-rel">{relativeDayLabel(selectedDate, today)}</span>
          <span className="date-full">
            {formatLongDate(selectedDate)}
            <CalendarDays size={14} aria-hidden="true" />
          </span>
        </button>
        <input
          ref={pickerRef}
          type="date"
          className="visually-hidden-input"
          value={selectedDate}
          max={today}
          tabIndex={-1}
          aria-hidden="true"
          onChange={(e) => isValidISODate(e.target.value) && setSelectedDate(e.target.value)}
        />
      </div>

      {isToday ? (
        <button type="button" className="icon-btn" disabled aria-label="Next day (not available — today is the latest day)">
          <ChevronRight size={22} />
        </button>
      ) : (
        <div className="date-right">
          <button type="button" className="chip chip-sm" onClick={goToday}>
            Today
          </button>
          <button type="button" className="icon-btn" onClick={() => shiftDay(1)} aria-label="Next day">
            <ChevronRight size={22} />
          </button>
        </div>
      )}
    </div>
  );
}
