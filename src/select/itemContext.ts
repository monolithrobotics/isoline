import type { ComputedRef } from 'vue'
import { createContext } from '../shared/createContext'

export interface SelectItemContext {
  /** Whether this option is the selected one. */
  selected: ComputedRef<boolean>
  /** Whether the keyboard is currently on it — not the same as selected. */
  highlighted: ComputedRef<boolean>
  /** Whether this option rejects interaction. */
  disabled: ComputedRef<boolean>
}

export const [provideSelectItemContext, injectSelectItemContext] =
  createContext<SelectItemContext>('SelectItem', 'SelectItem')
