import type { Ref } from 'vue'

/**
 * Escape-to-close and background scroll lock for the drill-down modals.
 *
 * `@keydown.esc` on the dialog element only fires when focus is inside it, so
 * Esc silently did nothing once the user clicked anywhere else. Listening on
 * the document fixes that, and locking `body` keeps the page behind the overlay
 * from scrolling away under the modal.
 */
export function useModalDismiss(isOpen: Ref<boolean>, close: () => void) {
  const onKeydown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') close()
  }

  watch(isOpen, open => {
    if (import.meta.server) return

    if (open) {
      document.addEventListener('keydown', onKeydown)
      document.body.style.overflow = 'hidden'
    } else {
      document.removeEventListener('keydown', onKeydown)
      document.body.style.overflow = ''
    }
  })

  onBeforeUnmount(() => {
    if (import.meta.server) return
    document.removeEventListener('keydown', onKeydown)
    document.body.style.overflow = ''
  })
}
