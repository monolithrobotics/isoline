import type { ComputedRef, Ref } from 'vue'
import { createContext } from '../shared/createContext'

export interface SelectItemRecord {
  id: string
  value: string
  /** What typeahead matches against. */
  textValue: string
  disabled: boolean
  el: HTMLElement
}

/** Where the highlight goes once an opening list has rendered its options. */
export type OpenIntent =
  { kind: 'first' } | { kind: 'last' } | { kind: 'typeahead'; char: string }

export interface SelectContext {
  /** The selected value, or `undefined` while nothing is selected. */
  value: ComputedRef<string | undefined>
  /** Whether the list is showing. */
  open: ComputedRef<boolean>
  /** Whether the control rejects interaction. */
  disabled: ComputedRef<boolean>
  /** Ids linking trigger, list and the highlighted option. */
  triggerId: string
  contentId: string
  /** The option the keyboard is on, which is not the same as the selected one. */
  activeId: Ref<string | undefined>
  triggerEl: Ref<HTMLElement | null>
  setOpen: (open: boolean) => void
  /**
   * Open the list and say where the highlight should land once the options
   * exist. They are unmounted while closed, so this cannot be done directly.
   */
  openWith: (intent: OpenIntent) => void
  select: (value: string) => void
  register: (item: SelectItemRecord) => void
  unregister: (id: string) => void
  /** Registered options in document order, disabled ones included. */
  items: () => SelectItemRecord[]
  highlight: (id: string | undefined) => void
  /** Move the highlight by a step, or to an end of the list. */
  moveHighlight: (to: number | 'first' | 'last') => void
  /** Advance the typeahead buffer and highlight the first match. */
  typeahead: (char: string) => void
}

export const [provideSelectContext, injectSelectContext] =
  createContext<SelectContext>('Select')
