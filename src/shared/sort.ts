/** Which way a column is sorted, or not at all. */
export type SortDirection = 'ascending' | 'descending'

export interface SortState {
  /** The column's id. */
  by: string
  direction: SortDirection
}

/**
 * Compares two cell values of unknown type.
 *
 * Strings go through `localeCompare` with `numeric`, so "item 2" sorts before
 * "item 10" and accented letters land where a reader expects rather than where
 * their code points fall. Dates and booleans are compared as numbers.
 */
function compare(a: unknown, b: unknown): number {
  if (typeof a === 'string' && typeof b === 'string') {
    return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' })
  }
  if (a instanceof Date && b instanceof Date) return a.getTime() - b.getTime()
  if (typeof a === 'boolean' && typeof b === 'boolean') return Number(a) - Number(b)
  if (typeof a === 'number' && typeof b === 'number') {
    // NaN compares false against everything, so a plain subtraction would make
    // the order depend on which side of the comparison it landed on.
    if (Number.isNaN(a) || Number.isNaN(b)) return Number.isNaN(a) ? 1 : -1
    return a - b
  }
  return String(a).localeCompare(String(b), undefined, { numeric: true })
}

/**
 * Sorts a copy of `rows` by a value read from each.
 *
 * **Stable**: rows the comparator calls equal keep the order they arrived in,
 * so sorting by status and then by name leaves names ordered within each
 * status. `Array.prototype.sort` is specified as stable, and the index
 * tiebreaker here is belt and braces for the same guarantee.
 *
 * **Missing values sort last in both directions.** A blank is not a small
 * value; flipping the direction to hunt for one is how a user ends up
 * believing the row is gone.
 */
export function sortRows<Row>(
  rows: readonly Row[],
  read: (row: Row) => unknown,
  direction: SortDirection,
): Row[] {
  const sign = direction === 'ascending' ? 1 : -1

  return rows
    .map((row, index) => ({ row, index, value: read(row) }))
    .sort((a, b) => {
      const aMissing = a.value === null || a.value === undefined || a.value === ''
      const bMissing = b.value === null || b.value === undefined || b.value === ''
      if (aMissing || bMissing) {
        if (aMissing && bMissing) return a.index - b.index
        return aMissing ? 1 : -1
      }

      const result = compare(a.value, b.value)
      return result === 0 ? a.index - b.index : result * sign
    })
    .map((entry) => entry.row)
}

/**
 * The next sort state for a header press.
 *
 * Three states, not two: ascending, descending, then back to the table's own
 * order. A column that can only be flipped traps the user — once sorted, there
 * is no way back to the order the data arrived in.
 */
export function nextSort(
  current: SortState | undefined,
  by: string,
): SortState | undefined {
  if (current?.by !== by) return { by, direction: 'ascending' }
  if (current.direction === 'ascending') return { by, direction: 'descending' }
  return undefined
}
