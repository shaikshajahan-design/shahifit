import { Bar, BarChart, Cell, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

export interface BarDatum {
  label: string;
  /** Longer label for tooltips / screen readers */
  title: string;
  value: number | null;
  highlight?: boolean;
}

interface Props {
  data: BarDatum[];
  target?: number;
  format: (n: number) => string;
  unit: string;
  height?: number;
  ariaLabel: string;
}

function ChartTooltip({ active, payload, format, unit }: { active?: boolean; payload?: { payload: BarDatum }[]; format: (n: number) => string; unit: string }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="chart-tooltip">
      <span className="chart-tooltip-title">{d.title}</span>
      <strong>{d.value === null ? 'Not logged' : `${format(d.value)} ${unit}`}</strong>
    </div>
  );
}

/** Small single-series bar chart with an optional target line. Includes a text table for screen readers. */
export default function MiniBarChart({ data, target, format, unit, height = 150, ariaLabel }: Props) {
  const plotted = data.map((d) => ({ ...d, v: d.value ?? 0 }));
  const max = Math.max(target ?? 0, ...plotted.map((d) => d.v));
  return (
    <figure className="chart" aria-label={ariaLabel}>
      <div aria-hidden="true" style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={plotted} margin={{ top: 8, right: 4, bottom: 0, left: 4 }} barCategoryGap="28%">
            <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-3)', fontSize: 12 }} interval={0} />
            <YAxis hide domain={[0, max > 0 ? max * 1.08 : 1]} />
            <Tooltip cursor={{ fill: 'var(--hover)' }} content={<ChartTooltip format={format} unit={unit} />} />
            {target ? <ReferenceLine y={target} stroke="var(--text-3)" strokeDasharray="4 4" strokeWidth={1} ifOverflow="extendDomain" /> : null}
            <Bar dataKey="v" radius={[4, 4, 0, 0]} isAnimationActive={false} minPointSize={0}>
              {plotted.map((d) => (
                <Cell key={d.title} fill={d.highlight ? 'var(--accent)' : 'var(--accent-muted)'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      {target ? (
        <figcaption className="chart-legend" aria-hidden="true">
          <i className="legend-dash" /> Target {format(target)} {unit}
        </figcaption>
      ) : null}
      <table className="sr-only">
        <caption>{ariaLabel}</caption>
        <tbody>
          {data.map((d) => (
            <tr key={d.title}>
              <th scope="row">{d.title}</th>
              <td>{d.value === null ? 'Not logged' : `${format(d.value)} ${unit}`}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
