/**
 * Categorical colour, the way this design system does it.
 *
 * The rule from DESIGN_SYSTEM.md: "Categorias, séries e ícones usam escala de
 * tinta — não paleta arco-íris." Rank carries the meaning, so the largest item
 * is full ink and each following one fades. A colour per category makes the
 * screen loud and says nothing — two categories being blue and pink tells the
 * reader precisely nothing about them.
 *
 * Used by the dashboard's "Para onde foi", the categories screen and the
 * installments projection, so the same category reads the same way everywhere.
 */

/** Bar/segment fill for the item at `index`, ordered largest first. */
export function inkScale(index: number): string {
  if (index === 0) return 'var(--ink-2)'
  // Fades with rank, with a floor so the tail stays visible against --rule.
  const alpha = Math.max(0.18, 0.62 - index * 0.055)
  return `oklch(0.45 0.012 60 / ${alpha.toFixed(2)})`
}

/**
 * Same ramp, but for stacked series where neighbouring segments touch and need
 * to stay separable. Alternates the lightness step so adjacent bands contrast
 * even when their alphas are close.
 */
export function inkScaleStacked(index: number, count: number): string {
  if (count <= 1) return 'var(--ink-2)'
  const t = index / Math.max(1, count - 1)
  const lightness = 0.30 + t * 0.42          // 0.30 → 0.72
  const nudge = index % 2 === 0 ? 0 : -0.04  // keeps touching bands distinct
  return `oklch(${(lightness + nudge).toFixed(3)} 0.014 60)`
}
