import type { ComputedRef } from 'vue'
import { createContext } from '../shared/createContext'

/** What a checkbox can be: on, off, or "some of the things below are on". */
export type CheckboxState = boolean | 'indeterminate'

export interface CheckboxContext {
  /** The current state, indeterminate included. */
  state: ComputedRef<CheckboxState>
  /** Whether the checkbox rejects interaction. */
  disabled: ComputedRef<boolean>
}

export const [provideCheckboxContext, injectCheckboxContext] =
  createContext<CheckboxContext>('Checkbox')

/** The `data-state` value for a given checkbox state. */
export function checkboxDataState(state: CheckboxState): string {
  if (state === 'indeterminate') return 'indeterminate'
  return state ? 'checked' : 'unchecked'
}
