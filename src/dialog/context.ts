import type { ComputedRef, Ref } from 'vue'
import { createContext } from '../shared/createContext'

export interface DialogContext {
  /** Whether the dialog is showing. */
  open: ComputedRef<boolean>
  /** Whether the dialog blocks the page behind it. */
  modal: ComputedRef<boolean>
  /** Open it. No-op when already open. */
  show: () => void
  /** Close it, for any reason — Escape, the overlay, a close button. */
  close: () => void
  /** Id of the content element, so the trigger can point `aria-controls` at it. */
  contentId: string
  /**
   * Ids of the labelling parts, and whether they were actually rendered.
   * `<DialogTitle>` is optional in markup but its absence changes the
   * content's `aria-labelledby`, so the parts announce themselves.
   */
  titleId: string
  descriptionId: string
  hasTitle: Ref<boolean>
  hasDescription: Ref<boolean>
}

export const [provideDialogContext, injectDialogContext] =
  createContext<DialogContext>('Dialog')
