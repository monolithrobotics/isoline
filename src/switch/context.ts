import type { ComputedRef } from 'vue'
import { createContext } from '../shared/createContext'

export interface SwitchContext {
  /** Whether the switch is currently on. */
  checked: ComputedRef<boolean>
  /** Whether the switch rejects interaction. */
  disabled: ComputedRef<boolean>
}

export const [provideSwitchContext, injectSwitchContext] =
  createContext<SwitchContext>('Switch')
