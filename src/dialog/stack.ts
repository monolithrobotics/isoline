/**
 * Every open dialog's content element, innermost last.
 *
 * A module, not component state: Escape and the focus trap must belong to the
 * topmost dialog only. Without a shared stack, a confirmation opened from
 * inside a dialog closes both on one Escape — the outer one's listener fires
 * too, and the user loses work they never asked to discard.
 */
const stack: HTMLElement[] = []

export function pushDialog(el: HTMLElement) {
  stack.push(el)
}

export function removeDialog(el: HTMLElement) {
  const index = stack.indexOf(el)
  if (index !== -1) stack.splice(index, 1)
}

export function isTopmostDialog(el: HTMLElement | null): boolean {
  return el !== null && stack.length > 0 && stack[stack.length - 1] === el
}
