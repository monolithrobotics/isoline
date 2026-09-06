import type { ComputedRef } from 'vue'
import { createContext } from '../shared/createContext'

export interface PasswordFieldContext {
  /** Whether the characters are currently readable. */
  visible: ComputedRef<boolean>
  /** Whether Caps Lock was on at the last keystroke in the field. */
  capsLock: ComputedRef<boolean>
  toggleVisibility: () => void
  /** Reported by the input, which is the only part that sees the key events. */
  setCapsLock: (on: boolean) => void
  /** Id of the input, so the toggle can point `aria-controls` at it. */
  inputId: string
}

export const [providePasswordFieldContext, injectPasswordFieldContext] =
  createContext<PasswordFieldContext>('PasswordField')
