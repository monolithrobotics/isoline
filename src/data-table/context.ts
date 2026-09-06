import type { ComputedRef } from 'vue'
import { createContext } from '../shared/createContext'
import type { SortState } from '../shared/sort'

export interface DataTableContext {
  /** How the table is currently sorted, if it is. */
  sort: ComputedRef<SortState | undefined>
  /** Cycle a column: ascending, descending, then back to the given order. */
  toggleSort: (columnId: string) => void

  /** Keys of the selected rows. */
  selection: ComputedRef<readonly string[]>
  /** Whether every selectable row is selected. */
  allSelected: ComputedRef<boolean>
  /** Whether some but not all are — the checkbox's indeterminate state. */
  someSelected: ComputedRef<boolean>
  isSelected: (key: string) => boolean
  toggleRow: (key: string) => void
  /** Select from the last touched row to this one, as Shift-click does. */
  selectRange: (key: string) => void
  toggleAll: () => void

  page: ComputedRef<number>
  pageCount: ComputedRef<number>
  goToPage: (page: number) => void
}

export const [provideDataTableContext, injectDataTableContext] =
  createContext<DataTableContext>('DataTable')
