import type { ComputedRef, Ref } from 'vue'
import { createContext } from '../shared/createContext'

export interface TooltipContext {
  open: ComputedRef<boolean>
  contentId: string
  triggerEl: Ref<HTMLElement | null>
  /** Show after the delay — what hovering does. */
  openAfterDelay: () => void
  /** Show now — what focusing does; a keyboard user has already committed. */
  openNow: () => void
  close: () => void
}

export const [provideTooltipContext, injectTooltipContext] =
  createContext<TooltipContext>('Tooltip')
