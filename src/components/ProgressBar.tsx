interface Props {
  value: number;
  max: number;
  label: string;
  tone?: 'accent' | 'warning' | 'success';
  size?: 'sm' | 'md' | 'lg';
}

/** Accessible progress bar. `label` is read by screen readers. */
export function ProgressBar({ value, max, label, tone = 'accent', size = 'md' }: Props) {
  const ratio = max > 0 ? Math.min(Math.max(value / max, 0), 1) : 0;
  return (
    <div
      className={`progress progress-${size}`}
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={Math.round(Math.min(value, max))}
    >
      <div className={`progress-fill tone-${tone}`} style={{ transform: `scaleX(${ratio})` }} />
    </div>
  );
}
