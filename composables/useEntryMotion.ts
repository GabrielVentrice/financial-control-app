/**
 * Entry cascade.
 *
 * The screen animates once on mount, top to bottom, to teach the reading order.
 * `om()` returns the two custom properties the `.om-*` classes in global.css
 * read; the speed multiplier scales every delay and duration from one place, so
 * the whole cascade can be slowed, sped up or switched off without touching a
 * single component.
 *
 * It must NOT re-run on a month change or a refetch — only on mount. That is why
 * the classes are applied unconditionally and the trigger is CSS animation on
 * first paint, rather than a reactive flag.
 */
const STORAGE_KEY = 'motion-scale'

export const useEntryMotion = () => {
  // 1 = default, 0.5–2 allowed, 0 = off.
  const scale = useState<number>('motion-scale', () => 1)

  onMounted(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored !== null) {
      const parsed = Number(stored)
      if (!Number.isNaN(parsed)) scale.value = parsed
    }
  })

  const setScale = (value: number) => {
    scale.value = Math.min(2, Math.max(0, value))
    if (import.meta.client) localStorage.setItem(STORAGE_KEY, String(scale.value))
  }

  /** Style binding for one animated element. */
  const om = (delay: number, duration: number = 560) => ({
    '--om-delay': `${delay}ms`,
    '--om-d': `${duration}ms`,
  })

  /** Applied on the shell so a scale of 0 disables the cascade entirely. */
  const motionClass = computed(() => (scale.value === 0 ? 'om-off' : ''))
  const motionStyle = computed(() => ({ '--motion-scale': String(scale.value || 1) }))

  return { scale: readonly(scale), setScale, om, motionClass, motionStyle }
}
