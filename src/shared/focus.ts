/**
 * Elements the browser will hand focus to via Tab, in document order.
 *
 * Deliberately a query rather than a walk: the set has to be recomputed on
 * every Tab because a dialog's contents change under it — a disabled button
 * that becomes enabled, a section that expands — and a list captured on open
 * would trap focus against elements that no longer take it.
 */
const FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
  '[contenteditable]:not([contenteditable="false"])',
  'details > summary',
  'iframe',
  'audio[controls]',
  'video[controls]',
].join(',')

export function getFocusable(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
    // `hidden` and `aria-hidden` elements are skipped by the browser's own
    // sequential navigation, so a trap that included them would stop on
    // something the user cannot see. Visibility from CSS is not checked:
    // reading layout on every Tab costs more than it is worth, and an author
    // who hides a control with `display: none` removes it from the query
    // anyway once the browser stops matching it.
    (el) => !el.hasAttribute('hidden') && el.getAttribute('aria-hidden') !== 'true',
  )
}
