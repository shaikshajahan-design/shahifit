import { useEffect, useRef, useState } from 'react';
import { Download, HardDrive, ShieldCheck, Trash2, Upload } from 'lucide-react';
import type { BackupFile, Settings } from '../../types';
import { BottomSheet } from '../../components/BottomSheet';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { Field } from '../../components/Field';
import { SegmentedControl } from '../../components/SegmentedControl';
import { useToast } from '../../components/Toast';
import { useSettings } from '../../hooks/useData';
import { settingsRepository } from '../../db/repositories/settingsRepository';
import {
  BackupError,
  INVALID_BACKUP_MESSAGE,
  deleteAllData,
  downloadBackup,
  parseBackupFile,
  restoreBackup,
  summarizeBackup,
} from '../../services/backupService';
import { LIMITS } from '../../data/defaultSettings';
import { APP_VERSION } from '../../data/constants';
import { fmtInt, parseNumber } from '../../utils/format';

type NumKey = 'calorieTarget' | 'proteinTarget' | 'stepTarget' | 'waterTarget' | 'bodyWeight' | 'height';

const NUM_FIELDS: Record<NumKey, { label: string; suffix: string; decimal?: boolean }> = {
  calorieTarget: { label: 'Daily calories', suffix: 'kcal' },
  proteinTarget: { label: 'Daily protein', suffix: 'g' },
  stepTarget: { label: 'Daily steps', suffix: 'steps' },
  waterTarget: { label: 'Daily water', suffix: 'ml' },
  bodyWeight: { label: 'Body weight', suffix: 'kg', decimal: true },
  height: { label: 'Height', suffix: 'cm' },
};

/** Number setting that saves on blur (or Enter) after validation. */
function NumberSetting({ k, settings, hint }: { k: NumKey; settings: Settings; hint?: string }) {
  const toast = useToast();
  const cfg = NUM_FIELDS[k];
  const [value, setValue] = useState(String(settings[k]));
  const [error, setError] = useState<string | null>(null);
  const focused = useRef(false);

  useEffect(() => {
    if (!focused.current) setValue(String(settings[k]));
  }, [settings, k]);

  const commit = async () => {
    focused.current = false;
    const n = parseNumber(value);
    const { min, max } = LIMITS[k];
    if (!(n >= min && n <= max)) {
      setError(`Enter a value between ${fmtInt(min)} and ${fmtInt(max)}.`);
      return;
    }
    const clean = cfg.decimal ? Math.round(n * 10) / 10 : Math.round(n);
    setError(null);
    setValue(String(clean));
    if (clean !== settings[k]) {
      await settingsRepository.update({ [k]: clean });
      toast({ message: `${cfg.label} updated` });
    }
  };

  return (
    <Field
      label={cfg.label}
      value={value}
      onChange={(v) => {
        setValue(v);
        setError(null);
      }}
      onFocus={() => (focused.current = true)}
      onBlur={() => void commit()}
      onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
      error={error}
      numeric={cfg.decimal ? 'decimal' : 'numeric'}
      suffix={cfg.suffix}
      hint={hint}
    />
  );
}

function backupAge(ts: number | null) {
  if (!ts) return 'No backup yet';
  const days = Math.floor((Date.now() - ts) / 86_400_000);
  if (days <= 0) return 'Last backup: today';
  if (days === 1) return 'Last backup: yesterday';
  return `Last backup: ${days} days ago`;
}

export function SettingsSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const settings = useSettings();
  const toast = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<BackupFile | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [busy, setBusy] = useState(false);

  const exportData = async () => {
    try {
      setBusy(true);
      const name = await downloadBackup();
      toast({ message: `Backup saved as ${name}` });
    } catch {
      toast({ message: 'Could not create the backup. Please try again.', tone: 'error' });
    } finally {
      setBusy(false);
    }
  };

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      setPending(await parseBackupFile(file));
    } catch (err) {
      const detail = err instanceof BackupError ? ` (${err.message})` : '';
      toast({ message: `${INVALID_BACKUP_MESSAGE}${detail}`, tone: 'error', duration: 6000 });
    }
  };

  const doRestore = async () => {
    if (!pending) return;
    const b = pending;
    setPending(null);
    try {
      await restoreBackup(b);
      toast({ message: 'Backup restored' });
    } catch {
      toast({ message: 'Restore failed. Your data was not changed.', tone: 'error' });
    }
  };

  const doDeleteAll = async () => {
    setConfirmDelete(false);
    await deleteAllData();
    toast({ message: 'All data deleted' });
  };

  const summary = pending ? summarizeBackup(pending) : null;
  const staleBackup = !settings.lastBackupAt || Date.now() - settings.lastBackupAt > 7 * 86_400_000;

  return (
    <>
      <BottomSheet open={open} onClose={onClose} title="Settings" size="tall">
        <div className="settings">
          <section className="settings-group" aria-labelledby="s-targets">
            <h3 id="s-targets" className="section-label">Daily targets</h3>
            <div className="field-grid">
              <NumberSetting k="calorieTarget" settings={settings} />
              <NumberSetting k="proteinTarget" settings={settings} />
              <NumberSetting k="stepTarget" settings={settings} />
              <NumberSetting k="waterTarget" settings={settings} />
            </div>
          </section>

          <section className="settings-group" aria-labelledby="s-body">
            <h3 id="s-body" className="section-label">Body</h3>
            <div className="field-grid">
              <NumberSetting k="bodyWeight" settings={settings} />
              <NumberSetting k="height" settings={settings} />
            </div>
            <p className="field-hint">Used for calorie and distance estimates. Body weight updates automatically when you log a new weight.</p>
          </section>

          <section className="settings-group" aria-labelledby="s-gym">
            <h3 id="s-gym" className="section-label">Gym</h3>
            <div className="field">
              <span className="field-label">Workouts per week</span>
              <SegmentedControl<4 | 5>
                label="Weekly workout target"
                value={settings.weeklyWorkoutTarget}
                onChange={(v) => void settingsRepository.update({ weeklyWorkoutTarget: v })}
                options={[
                  { id: 4, label: '4 workouts' },
                  { id: 5, label: '5 workouts' },
                ]}
              />
            </div>
            <div className="field">
              <span className="field-label">Schedule</span>
              <SegmentedControl<'5day' | '4day' | 'custom'>
                label="Gym schedule"
                value={settings.scheduleMode}
                onChange={(m) => m !== 'custom' && void settingsRepository.applySchedulePreset(m)}
                options={[
                  { id: '5day', label: '5-day' },
                  { id: '4day', label: '4-day' },
                  ...(settings.scheduleMode === 'custom' ? [{ id: 'custom' as const, label: 'Custom' }] : []),
                ]}
              />
            </div>
            <p className="field-hint">Edit individual days from the Weekly schedule card on the Gym tab.</p>
          </section>

          <section className="settings-group" aria-labelledby="s-theme">
            <h3 id="s-theme" className="section-label">Appearance</h3>
            <SegmentedControl<Settings['theme']>
              label="Theme"
              value={settings.theme}
              onChange={(t) => void settingsRepository.update({ theme: t })}
              options={[
                { id: 'system', label: 'System' },
                { id: 'light', label: 'Light' },
                { id: 'dark', label: 'Dark' },
              ]}
            />
          </section>

          <section className="settings-group" aria-labelledby="s-data">
            <h3 id="s-data" className="section-label">Backup &amp; data</h3>
            <div className={`note ${staleBackup ? 'note-warning' : ''}`}>
              <HardDrive size={18} aria-hidden="true" />
              <div>
                <p>Your fitness data is stored on this device. Use Export Backup regularly to keep a copy.</p>
                <p className="note-sub">{backupAge(settings.lastBackupAt)}</p>
              </div>
            </div>
            <div className="settings-actions">
              <button type="button" className="btn btn-secondary btn-block" onClick={() => void exportData()} disabled={busy}>
                <Download size={18} aria-hidden="true" /> Export Backup
              </button>
              <button type="button" className="btn btn-secondary btn-block" onClick={() => fileRef.current?.click()}>
                <Upload size={18} aria-hidden="true" /> Restore Backup
              </button>
              <input ref={fileRef} type="file" accept="application/json,.json" className="visually-hidden-input" onChange={(e) => void onFile(e)} tabIndex={-1} aria-hidden="true" />
              <button type="button" className="btn btn-danger-outline btn-block" onClick={() => setConfirmDelete(true)}>
                <Trash2 size={18} aria-hidden="true" /> Delete All Data
              </button>
            </div>
          </section>

          <section className="settings-group about">
            <p>
              <ShieldCheck size={16} aria-hidden="true" /> Private by design: no account, no tracking, works offline. Nothing leaves this device.
            </p>
            <p className="muted">ShahiFit v{APP_VERSION}</p>
          </section>
        </div>
      </BottomSheet>

      <ConfirmDialog
        open={!!pending}
        title="Restore this backup?"
        message={
          summary
            ? `This replaces ALL current data with the backup${summary.exportedAt ? ` from ${new Date(summary.exportedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}` : ''}: ${summary.foods} food entries, ${summary.steps} step days, ${summary.workouts} workouts, ${summary.weights} weigh-ins.`
            : ''
        }
        confirmLabel="Replace & restore"
        destructive
        onConfirm={() => void doRestore()}
        onCancel={() => setPending(null)}
      />
      <ConfirmDialog
        open={confirmDelete}
        title="Delete all data?"
        message="This permanently erases all food, steps, workouts, weight, water and settings on this device. Export a backup first if you might need it. This cannot be undone."
        confirmLabel="Delete everything"
        destructive
        onConfirm={() => void doDeleteAll()}
        onCancel={() => setConfirmDelete(false)}
      />
    </>
  );
}
