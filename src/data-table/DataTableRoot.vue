<script setup lang="ts" generic="Row">
/**
 * Sorting, selection and paging over rows you already have.
 *
 * It renders no table. The markup is yours — a `<table>`, a grid of cards, a
 * list — and the derived rows arrive as a slot prop. What is left is the part
 * that is genuinely easy to get wrong: a stable sort, missing values, selection
 * that survives re-sorting, and page bounds when the data shrinks underneath.
 *
 * **Filtering is deliberately absent.** It is one `.filter()` before the rows
 * are passed in, and it is the operation the consumer always knows better — a
 * search box, a facet, a server round trip. A `filters` prop would be an API to
 * learn in exchange for a method call.
 *
 * ```vue
 * <DataTableRoot :rows="drones" :row-key="(d) => d.id" v-model:selection="picked">
 *   <template #default="{ rows }">
 *     <table>…</table>
 *   </template>
 * </DataTableRoot>
 * ```
 */
import { computed, watch } from 'vue'
import { provideDataTableContext } from './context'
import { nextSort, sortRows, type SortState } from '../shared/sort'

const props = withDefaults(
  defineProps<{
    /** The rows to show. Already filtered, if you filter. */
    rows: readonly Row[]
    /** A stable identity per row. Never the array index. */
    rowKey: (row: Row) => string
    /** Reads the sortable value out of a row, for a column id. */
    getSortValue?: (row: Row, columnId: string) => unknown
    /** How the table is sorted. Use with `v-model:sort`. */
    sort?: SortState
    /** Selected row keys. Use with `v-model:selection`. */
    selection?: readonly string[]
    /** Rows per page. Omit for no paging. */
    pageSize?: number
    /** The current page, 1-based. Use with `v-model:page`. */
    page?: number
    /** Rows that cannot be selected — locked, archived, already running. */
    isRowSelectable?: (row: Row) => boolean
  }>(),
  {
    getSortValue: undefined,
    sort: undefined,
    selection: () => [],
    pageSize: undefined,
    page: 1,
    isRowSelectable: undefined,
  },
)

const emit = defineEmits<{
  'update:sort': [sort: SortState | undefined]
  'update:selection': [selection: string[]]
  'update:page': [page: number]
}>()

const sortedRows = computed(() => {
  const state = props.sort
  if (!state || !props.getSortValue) return [...props.rows]
  const read = props.getSortValue
  return sortRows(props.rows, (row) => read(row, state.by), state.direction)
})

const pageCount = computed(() =>
  props.pageSize ? Math.max(1, Math.ceil(sortedRows.value.length / props.pageSize)) : 1,
)

// Clamped rather than trusted: rows disappear — a filter narrows, a delete
// lands, a poll returns less — and page 7 of 3 renders an empty table that
// looks like a loading bug.
const page = computed(() => Math.min(Math.max(1, props.page), pageCount.value))

const pagedRows = computed(() => {
  if (!props.pageSize) return sortedRows.value
  const start = (page.value - 1) * props.pageSize
  return sortedRows.value.slice(start, start + props.pageSize)
})

watch(page, (clamped) => {
  if (clamped !== props.page) emit('update:page', clamped)
})

const selectableRows = computed(() =>
  props.isRowSelectable ? props.rows.filter(props.isRowSelectable) : [...props.rows],
)

const selectedSet = computed(() => new Set(props.selection))

function isSelected(key: string) {
  return selectedSet.value.has(key)
}

const allSelected = computed(
  () =>
    selectableRows.value.length > 0 &&
    selectableRows.value.every((row) => isSelected(props.rowKey(row))),
)

const someSelected = computed(
  () =>
    !allSelected.value &&
    selectableRows.value.some((row) => isSelected(props.rowKey(row))),
)

/** Where a Shift-click range starts. */
let anchor: string | undefined

function emitSelection(keys: string[]) {
  emit('update:selection', keys)
}

function toggleRow(key: string) {
  anchor = key
  emitSelection(
    isSelected(key)
      ? props.selection.filter((item) => item !== key)
      : [...props.selection, key],
  )
}

function selectRange(key: string) {
  // Ranges run over the rows as displayed, not as given: a user shift-clicking
  // picks what is between the two rows on screen, whatever the sort is.
  const keys = sortedRows.value.map(props.rowKey)
  const to = keys.indexOf(key)
  const from = anchor === undefined ? to : keys.indexOf(anchor)
  if (to === -1 || from === -1) return toggleRow(key)

  const [start, end] = from <= to ? [from, to] : [to, from]
  const selectable = new Set(selectableRows.value.map(props.rowKey))
  const range = keys
    .slice(start, end + 1)
    .filter((candidate) => selectable.has(candidate))

  emitSelection([...new Set([...props.selection, ...range])])
  anchor = key
}

function toggleAll() {
  // Covers every row given to the table, not just the current page: a user who
  // ticks the header box and then pages expects to still have them all.
  if (allSelected.value) return emitSelection([])
  emitSelection([...new Set(selectableRows.value.map(props.rowKey))])
}

function toggleSort(columnId: string) {
  emit('update:sort', nextSort(props.sort, columnId))
  // Back to the first page: the row someone was looking at is not on page 4
  // any more, and leaving them there shows an arbitrary slice.
  if (props.pageSize) emit('update:page', 1)
}

function goToPage(next: number) {
  emit('update:page', Math.min(Math.max(1, next), pageCount.value))
}

provideDataTableContext({
  sort: computed(() => props.sort),
  toggleSort,
  selection: computed(() => props.selection),
  allSelected,
  someSelected,
  isSelected,
  toggleRow,
  selectRange,
  toggleAll,
  page,
  pageCount,
  goToPage,
})
</script>

<template>
  <slot
    :rows="pagedRows"
    :all-rows="sortedRows"
    :sort="sort"
    :page="page"
    :page-count="pageCount"
    :selection="selection"
  />
</template>
