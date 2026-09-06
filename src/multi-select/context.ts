import type { ComputedRef, Ref } from 'vue'
import { createContext } from '../shared/createContext'
import type { ListboxItem } from '../shared/listbox'

export interface MultiSelectContext {
  /** The selected values, in the order the consumer holds them. */
  value: ComputedRef<readonly string[]>
  open: ComputedRef<boolean>
  disabled: ComputedRef<boolean>
  activeId: Ref<string | undefined>
  /** Add or remove a value. The list stays open either way. */
  toggle: (value: string) => void
  register: (item: ListboxItem) => void
  unregister: (id: string) => void
  items: () => ListboxItem[]
  highlight: (id: string | undefined) => void
  moveHighlight: (to: number | 'first' | 'last') => void
  typeahead: (char: string) => void
  setOpen: (open: boolean) => void
  /** Open, and say where the highlight lands once the options exist. */
  openWith: (
    intent: { kind: 'first' | 'last' } | { kind: 'typeahead'; char: string },
  ) => void
}

export const [provideMultiSelectContext, injectMultiSelectContext] =
  createContext<MultiSelectContext>('MultiSelect')

export interface MultiSelectItemContext {
  selected: ComputedRef<boolean>
  highlighted: ComputedRef<boolean>
  disabled: ComputedRef<boolean>
}

export const [provideMultiSelectItemContext, injectMultiSelectItemContext] =
  createContext<MultiSelectItemContext>('MultiSelectItem', 'MultiSelectItem')
