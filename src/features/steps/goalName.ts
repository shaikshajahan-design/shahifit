import { fmtInt } from '../../utils/format';

/** "10K" for 10,000 (or 8K etc. for round thousands), otherwise "8,500-step". */
export function goalName(target: number) {
  if (target % 1000 === 0) return `${target / 1000}K`;
  return `${fmtInt(target)}-step`;
}
