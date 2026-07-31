const STORAGE_KEY = 'privacy-mode'

/**
 * Privacy mode: blurs every monetary value while keeping layout and labels
 * intact, so the screen stays readable-as-structure with someone behind you.
 *
 * Elements opt in with the `maskable` class; the blur comes from `.is-private`
 * on the shell (see global.css). Doing it with one class on the root rather than
 * per-value bindings keeps it impossible to forget a value on a new screen —
 * you only have to remember `maskable`.
 */
export const usePrivacyMode = () => {
  const isPrivate = useState<boolean>('privacy-mode', () => false)

  onMounted(() => {
    isPrivate.value = localStorage.getItem(STORAGE_KEY) === 'true'
  })

  const toggle = () => {
    isPrivate.value = !isPrivate.value
    if (import.meta.client) localStorage.setItem(STORAGE_KEY, String(isPrivate.value))
  }

  return { isPrivate: readonly(isPrivate), toggle }
}
