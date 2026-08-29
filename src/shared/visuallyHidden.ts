/**
 * Style for an input that must exist for the form but must never be seen.
 *
 * Not `display: none` and not `visibility: hidden`: both take the element out
 * of constraint validation's reach, so a `required` field that fails has
 * nothing for the browser to anchor its bubble to — Chrome logs "An invalid
 * form control is not focusable" and reports nothing to the user. Clipping
 * keeps the element rendered and reportable while it occupies no space.
 */
export const VISUALLY_HIDDEN = {
  position: 'absolute',
  width: '1px',
  height: '1px',
  margin: '-1px',
  padding: '0',
  overflow: 'hidden',
  clipPath: 'inset(50%)',
  whiteSpace: 'nowrap',
  border: '0',
} as const
