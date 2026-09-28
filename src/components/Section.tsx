import type { ReactNode } from 'react';

interface Props {
  title?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  flush?: boolean;
  id?: string;
}

/** A titled card. Keep nesting shallow: sections should not contain other sections. */
export function Section({ title, action, children, className = '', flush, id }: Props) {
  return (
    <section className={`card ${flush ? 'card-flush' : ''} ${className}`} aria-labelledby={title && id ? id : undefined}>
      {(title || action) && (
        <div className="card-head">
          {title && (
            <h3 className="card-label" id={id}>
              {title}
            </h3>
          )}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}
