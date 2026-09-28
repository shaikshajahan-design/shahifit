import { useState } from 'react';
import { Pencil } from 'lucide-react';
import { BottomSheet } from '../../components/BottomSheet';
import { Section } from '../../components/Section';
import { SegmentedControl } from '../../components/SegmentedControl';
import { useSettings, useTemplates } from '../../hooks/useData';
import { useSelectedDate } from '../../hooks/useSelectedDate';
import { settingsRepository } from '../../db/repositories/settingsRepository';
import { OPTIONAL, REST } from '../../data/workoutTemplates';
import { WEEKDAY_LONG, WEEKDAY_SHORT, weekdayIndex } from '../../utils/date';
import { isWorkoutSlot, slotLabel } from './scheduleText';

export function ScheduleCard() {
  const { today } = useSelectedDate();
  const settings = useSettings();
  const templates = useTemplates();
  const [open, setOpen] = useState(false);
  const todayIdx = weekdayIndex(today);
  const modeLabel = settings.scheduleMode === '5day' ? '5-day split' : settings.scheduleMode === '4day' ? '4-day split' : 'Custom';

  return (
    <>
      <Section
        title={`Weekly schedule · ${modeLabel}`}
        action={
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setOpen(true)}>
            <Pencil size={15} aria-hidden="true" /> Edit
          </button>
        }
      >
        <ul className="schedule">
          {settings.schedule.map((slot, i) => (
            <li key={i} className={`schedule-row ${i === todayIdx ? 'is-today' : ''} ${isWorkoutSlot(slot) ? '' : 'is-rest'}`}>
              <span className="schedule-day">{WEEKDAY_SHORT[i]}</span>
              <span className="schedule-name">{slotLabel(slot, templates)}</span>
              {i === todayIdx && <span className="tag">Today</span>}
            </li>
          ))}
        </ul>
      </Section>

      <BottomSheet open={open} onClose={() => setOpen(false)} title="Weekly schedule" subtitle="Your plan — you can always log a different workout">
        <div className="form">
          <div className="field">
            <span className="field-label">Preset</span>
            <SegmentedControl<'5day' | '4day' | 'custom'>
              label="Schedule preset"
              value={settings.scheduleMode}
              onChange={(m) => m !== 'custom' && void settingsRepository.applySchedulePreset(m)}
              options={[
                { id: '5day', label: '5-day' },
                { id: '4day', label: '4-day' },
                { id: 'custom', label: 'Custom' },
              ]}
            />
          </div>
          <ul className="schedule-edit">
            {settings.schedule.map((slot, i) => (
              <li key={i}>
                <label htmlFor={`sched-${i}`}>{WEEKDAY_LONG[i]}</label>
                <div className="field-control">
                  <select id={`sched-${i}`} value={slot} onChange={(e) => void settingsRepository.setScheduleDay(i, e.target.value)}>
                    {templates.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                    <option value={OPTIONAL}>Rest / Optional</option>
                    <option value={REST}>Rest</option>
                  </select>
                </div>
              </li>
            ))}
          </ul>
          <p className="field-hint">Changing any day switches the preset to Custom. Choose 5-day or 4-day to restore a preset.</p>
        </div>
      </BottomSheet>
    </>
  );
}
