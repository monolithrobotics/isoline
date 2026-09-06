/**
 * Stops the page behind a modal from scrolling.
 *
 * Reference-counted because dialogs stack: a confirmation opened from inside
 * a dialog closes first, and if it restored the body on its way out the page
 * behind the dialog still standing would start scrolling again.
 */
let depth = 0
let restore: string | null = null

export function lockScroll() {
  if (typeof document === 'undefined') return
  if (depth === 0) {
    restore = document.body.style.overflow
    document.body.style.overflow = 'hidden'
  }
  depth += 1
}

export function unlockScroll() {
  if (typeof document === 'undefined') return
  depth = Math.max(0, depth - 1)
  if (depth === 0) {
    // Restores whatever the page had, including nothing — writing `''` back
    // over an author's own `overflow: hidden` would be our bug, not theirs.
    document.body.style.overflow = restore ?? ''
    restore = null
  }
}
