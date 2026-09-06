import type { ComputedRef } from 'vue'
import { createContext } from '../shared/createContext'

export interface SliderContext {
  /** The current value. */
  value: ComputedRef<number>
  /** How far along the range the value sits, 0–1, for positioning parts. */
  fraction: ComputedRef<number>
  /** Whether the slider rejects interaction. */
  disabled: ComputedRef<boolean>
  /** Which way it runs. */
  orientation: ComputedRef<'horizontal' | 'vertical'>
}

export const [provideSliderContext, injectSliderContext] =
  createContext<SliderContext>('Slider')
