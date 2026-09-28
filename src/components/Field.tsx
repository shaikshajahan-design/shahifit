import { useId, type InputHTMLAttributes, type ReactNode } from 'react';

interface Props extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string | null;
  suffix?: ReactNode;
  hint?: ReactNode;
  numeric?: 'decimal' | 'numeric';
}

/** Labelled text/number input. Numeric fields use type="text" + inputMode for a reliable mobile keypad. */
export function Field({ label, value, onChange, error, suffix, hint, numeric, className = '', ...rest }: Props) {
  const id = useId();
  const errId = `${id}-err`;
  return (
    <div className={`field ${error ? 'has-error' : ''} ${className}`}>
      <label htmlFor={id} className="field-label">
        {label}
      </label>
      <div className="field-control">
        <input
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          inputMode={numeric}
          autoComplete="off"
          aria-invalid={!!error}
          aria-describedby={error ? errId : undefined}
          {...rest}
        />
        {suffix && <span className="field-suffix">{suffix}</span>}
      </div>
      {error ? (
        <p id={errId} className="field-error" role="alert">
          {error}
        </p>
      ) : (
        hint && <p className="field-hint">{hint}</p>
      )}
    </div>
  );
}
