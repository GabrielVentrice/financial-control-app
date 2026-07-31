/**
 * Period-over-period variation, rendered the way a reader judges it.
 *
 * Two rules the design system is explicit about:
 *
 * 1. Polarity follows the METRIC, not the sign. Spending more is bad news even
 *    though the number went up; earning more is good news for the same arrow.
 *    Deciding by `value > 0` colours half the table wrong.
 *
 * 2. Edge cases become words. A category that did not exist last month is
 *    `novo`, not "+∞%"; an unchanged one is `estável`, not "0%". Percentages of
 *    zero are noise dressed as precision.
 */
export type DeltaPolarity = 'expense' | 'income'

export interface Delta {
  kind: 'up' | 'down' | 'flat' | 'new'
  /** "▴ 135%", "estável", "novo" */
  label: string
  /** Tailwind text colour class. */
  cls: string
  /** Signed absolute change, for sorting by "maior alta". */
  absolute: number
}

export function computeDelta(
  current: number,
  previous: number,
  polarity: DeltaPolarity = 'expense'
): Delta {
  const absolute = current - previous

  if (previous === 0) {
    return current === 0
      ? { kind: 'flat', label: 'estável', cls: 'text-text-3', absolute }
      : { kind: 'new', label: 'novo', cls: 'text-warn', absolute }
  }

  const pct = Math.round((absolute / previous) * 100)

  if (pct === 0) {
    return { kind: 'flat', label: 'estável', cls: 'text-text-3', absolute }
  }

  const up = pct > 0
  // Rising expense is bad; rising income is good.
  const good = polarity === 'expense' ? !up : up

  return {
    kind: up ? 'up' : 'down',
    label: `${up ? '▴' : '▾'} ${Math.abs(pct)}%`,
    cls: good ? 'text-pos-text' : 'text-neg-text',
    absolute,
  }
}
