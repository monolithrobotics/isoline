import type { ComputedRef } from 'vue'
import { createContext } from '../shared/createContext'

export interface SplitterPanel {
  el: HTMLElement
  /** Smallest share this panel accepts, in percent. */
  minSize: number
}

export interface SplitterContext {
  /** Each panel's share of the container, in percent, in document order. */
  sizes: ComputedRef<readonly number[]>
  orientation: ComputedRef<'horizontal' | 'vertical'>
  disabled: ComputedRef<boolean>
  registerPanel: (panel: SplitterPanel) => void
  unregisterPanel: (el: HTMLElement) => void
  /** Panels in document order. */
  panels: () => SplitterPanel[]
  /** This panel's share, for its own flex-basis. */
  sizeOf: (el: HTMLElement) => number
  /**
   * Move the boundary a handle sits on.
   *
   * The handle passes its own element rather than an index: its position in the
   * DOM already says which two panels it divides, and an index prop would be a
   * second source of truth for the consumer to keep in step.
   */
  resizeAt: (handle: HTMLElement, deltaPercent: number) => void
  /** The pair a handle divides, for its own ARIA values. */
  boundaryOf: (handle: HTMLElement) => { before: number; after: number } | undefined
}

export const [provideSplitterContext, injectSplitterContext] =
  createContext<SplitterContext>('Splitter')
