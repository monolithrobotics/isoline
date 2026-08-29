import type { ComputedRef } from 'vue'
import { createContext } from '../shared/createContext'

export interface RadioGroupContext {
  /** The selected value, or `undefined` while nothing is selected. */
  value: ComputedRef<string | undefined>
  /** Whether the whole group rejects interaction. */
  disabled: ComputedRef<boolean>
  /** Whether arrow navigation wraps past the ends. */
  loop: ComputedRef<boolean>
  /** Select a value. Ignored when the group is disabled. */
  select: (value: string) => void
  /** Items report their element so the root can order and move focus. */
  register: (el: HTMLElement) => void
  unregister: (el: HTMLElement) => void
  /** Registered items in document order, disabled ones included. */
  items: () => HTMLElement[]
}

export const [provideRadioGroupContext, injectRadioGroupContext] =
  createContext<RadioGroupContext>('RadioGroup')

export interface RadioGroupItemContext {
  /** Whether this item is the selected one. */
  checked: ComputedRef<boolean>
  /** Whether this item rejects interaction, its group included. */
  disabled: ComputedRef<boolean>
}

export const [provideRadioGroupItemContext, injectRadioGroupItemContext] =
  createContext<RadioGroupItemContext>('RadioGroupItem', 'RadioGroupItem')
