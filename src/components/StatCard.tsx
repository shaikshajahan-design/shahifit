import type { ReactNode } from 'react';

interface Props {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  icon?: ReactNode;
}

export function StatCard({ label, value, sub, icon }: Props) {
  return (
    <div className="stat">
      <div className="stat-label">
        {icon}
        <span>{label}</span>
      </div>
      <div className="stat-value">{value}</div>
      {sub && <div className="stat-sub">{sub}</div>}
    </div>
  );
}
