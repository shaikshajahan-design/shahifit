import type { ReactNode } from 'react';

interface Props {
  icon: ReactNode;
  title: string;
  text?: string;
  action?: ReactNode;
  compact?: boolean;
}

export function EmptyState({ icon, title, text, action, compact }: Props) {
  return (
    <div className={`empty ${compact ? 'empty-compact' : ''}`}>
      <div className="empty-icon" aria-hidden="true">
        {icon}
      </div>
      <p className="empty-title">{title}</p>
      {text && <p className="empty-text">{text}</p>}
      {action}
    </div>
  );
}
