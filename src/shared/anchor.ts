/**
 * Places a floating element against an anchor, in viewport coordinates.
 *
 * Deliberately small: below the anchor, flipped above when there is not enough
 * room below and more room above, and clamped so it never hangs off the side.
 * That is the behaviour a select needs and nothing more — real collision
 * handling for arbitrary placements is what Floating UI is for, and pulling in
 * a dependency to do it would put weight in every consumer's bundle for a case
 * this library does not have.
 *
 * Assumes the floating element is `position: fixed`, so the numbers are
 * viewport-relative and no offset-parent arithmetic is needed.
 */
export interface AnchoredPosition {
  top: number
  left: number
  /** Which side it ended up on, for the consumer to style transitions off. */
  side: 'top' | 'bottom'
}

export function anchorBelow(
  anchor: HTMLElement,
  floating: HTMLElement,
  { offset = 4, padding = 8 } = {},
): AnchoredPosition {
  const rect = anchor.getBoundingClientRect()
  const width = floating.offsetWidth
  const height = floating.offsetHeight
  const viewportWidth = window.innerWidth
  const viewportHeight = window.innerHeight

  const below = rect.bottom + offset
  const above = rect.top - height - offset
  const fitsBelow = below + height <= viewportHeight - padding
  // Flipping only pays off when the other side is actually roomier; a list
  // taller than the viewport fits nowhere, and flipping it would move the
  // clipped part from the bottom (where the user can scroll to it) to the top
  // (where they cannot).
  const side = fitsBelow || rect.top < viewportHeight - rect.bottom ? 'bottom' : 'top'

  const left = Math.min(Math.max(padding, rect.left), viewportWidth - width - padding)

  return { top: side === 'bottom' ? below : above, left: Math.max(padding, left), side }
}
