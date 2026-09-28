const intFmt = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 });
const oneDp = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 1 });

/** 12,450 */
export const fmtInt = (n: number) => intFmt.format(Math.round(n));

/** 62.5 → '62.5', 62 → '62' */
export const fmt1 = (n: number) => oneDp.format(Math.round(n * 10) / 10);

/** 2250 → '2.25' (litres) */
export const fmtLitres = (ml: number) => (ml / 1000).toFixed(2);

export const fmtSigned = (n: number, digits = 1) => {
  const r = Number(n.toFixed(digits));
  if (r === 0) return '0';
  return `${r > 0 ? '+' : '−'}${Math.abs(r).toFixed(digits)}`;
};

export const pct = (value: number, target: number) =>
  target > 0 ? Math.round(Math.min(value / target, 1) * 100) : 0;

export function round1(n: number) {
  return Math.round(n * 10) / 10;
}

/** Parse a user-typed number; accepts '1,200' or '62.5'. Returns NaN if invalid. */
export function parseNumber(input: string): number {
  const cleaned = input.replace(/,/g, '').trim();
  if (cleaned === '') return NaN;
  if (!/^-?\d*\.?\d+$/.test(cleaned)) return NaN;
  return Number(cleaned);
}
