import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { WeightEntry } from '../../types';
import { formatShortDate } from '../../utils/date';
import { fmt1 } from '../../utils/format';

function Tip({ active, payload }: { active?: boolean; payload?: { payload: WeightEntry }[] }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="chart-tooltip">
      <span className="chart-tooltip-title">{formatShortDate(d.date)}</span>
      <strong>{fmt1(d.weight)} kg</strong>
      {d.waist ? <span>Waist {fmt1(d.waist)} cm</span> : null}
    </div>
  );
}

export default function WeightLineChart({ entries }: { entries: WeightEntry[] }) {
  const weights = entries.map((e) => e.weight);
  const min = Math.floor(Math.min(...weights) - 1);
  const max = Math.ceil(Math.max(...weights) + 1);
  return (
    <figure className="chart" aria-label="Weight trend">
      <div aria-hidden="true" style={{ height: 170 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={entries} margin={{ top: 8, right: 8, bottom: 0, left: -18 }}>
            <CartesianGrid vertical={false} stroke="var(--border)" />
            <XAxis
              dataKey="date"
              tickFormatter={(d: string) => formatShortDate(d)}
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'var(--text-3)', fontSize: 11 }}
              minTickGap={24}
            />
            <YAxis domain={[min, max]} axisLine={false} tickLine={false} tick={{ fill: 'var(--text-3)', fontSize: 11 }} width={44} allowDecimals={false} />
            <Tooltip content={<Tip />} cursor={{ stroke: 'var(--text-3)', strokeDasharray: '3 3' }} />
            <Line
              type="monotone"
              dataKey="weight"
              stroke="var(--accent)"
              strokeWidth={2}
              dot={entries.length <= 20 ? { r: 4, fill: 'var(--accent)', stroke: 'var(--surface)', strokeWidth: 2 } : false}
              activeDot={{ r: 5, stroke: 'var(--surface)', strokeWidth: 2 }}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <table className="sr-only">
        <caption>Weight entries</caption>
        <tbody>
          {entries.map((e) => (
            <tr key={e.date}>
              <th scope="row">{formatShortDate(e.date)}</th>
              <td>{fmt1(e.weight)} kg</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
