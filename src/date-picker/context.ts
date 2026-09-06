import type { ComputedRef, Ref } from 'vue'
import { createContext } from '../shared/createContext'

export interface DatePickerDay {
  date: Date
  /** Whether it belongs to the month on screen, rather than filling a week. */
  inMonth: boolean
  selected: boolean
  today: boolean
  disabled: boolean
}

export interface DatePickerContext {
  /** The chosen day, or `undefined` while nothing is chosen. */
  value: ComputedRef<Date | undefined>
  /** The month on screen, which moves without changing the selection. */
  viewMonth: ComputedRef<Date>
  /** The day the keyboard is on. Exactly one cell is tabbable, and this is it. */
  focusedDate: Ref<Date>
  weeks: ComputedRef<DatePickerDay[][]>
  disabled: ComputedRef<boolean>
  select: (date: Date) => void
  /** Move the focused day, paging the view when it leaves the month. */
  moveFocus: (to: Date) => void
  shiftMonth: (months: number) => void
  isDisabled: (date: Date) => boolean
}

export const [provideDatePickerContext, injectDatePickerContext] =
  createContext<DatePickerContext>('DatePicker')
