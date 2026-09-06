import type { ComputedRef } from 'vue'
import { createContext } from '../shared/createContext'

export interface NumberFieldContext {
  /** The current value, or `undefined` while the field is empty. */
  value: ComputedRef<number | undefined>
  /** Whether the field rejects interaction. */
  disabled: ComputedRef<boolean>
  /** Whether stepping up would change anything. */
  canIncrement: ComputedRef<boolean>
  /** Whether stepping down would change anything. */
  canDecrement: ComputedRef<boolean>
  /** Step by `direction` steps, clamped to the range. */
  step: (direction: number) => void
  /** How many steps Page Up and Page Down move. */
  largeStep: ComputedRef<number>
  /** The range and granularity, for the input's own ARIA and validation. */
  min: ComputedRef<number>
  max: ComputedRef<number>
  stepSize: ComputedRef<number>
  /** Field identity, so the input submits with its form. */
  name: ComputedRef<string | undefined>
  required: ComputedRef<boolean>
  /**
   * Commit raw text from the input. Parsing lives here rather than in the
   * input so the rules — empty means `undefined`, unparseable changes nothing
   * — hold however the value arrives.
   */
  commit: (text: string) => void
}

export const [provideNumberFieldContext, injectNumberFieldContext] =
  createContext<NumberFieldContext>('NumberField')
