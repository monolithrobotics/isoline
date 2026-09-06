import type { ComputedRef, Ref } from 'vue'
import { createContext } from './createContext'

/**
 * What a popup list's shell needs, and nothing about what selection means.
 *
 * Single- and multi-choice lists differ only in what a click does. Their
 * popup — portalled, anchored to the trigger, closed by a press outside — is
 * the same, so both provide this and share one `Content` and one `Portal`.
 */
export interface ListboxPopupContext {
  open: ComputedRef<boolean>
  /** Whether the list announces itself as taking more than one choice. */
  multiselectable: boolean
  triggerId: string
  contentId: string
  triggerEl: Ref<HTMLElement | null>
  setOpen: (open: boolean) => void
}

export const [provideListboxPopupContext, injectListboxPopupContext] =
  createContext<ListboxPopupContext>('Listbox', 'SelectRoot or MultiSelectRoot')
