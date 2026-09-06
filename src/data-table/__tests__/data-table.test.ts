import { describe, it, expect } from 'vitest'
import { enableAutoUnmount, mount } from '@vue/test-utils'
import { defineComponent, h, ref, type Component } from 'vue'
import DataTableRoot from '../DataTableRoot.vue'
import DataTableColumnHeader from '../DataTableColumnHeader.vue'
import DataTableRow from '../DataTableRow.vue'
import DataTableRowCheckbox from '../DataTableRowCheckbox.vue'
import DataTableSelectAll from '../DataTableSelectAll.vue'
import { nextSort, sortRows, type SortState } from '../../shared/sort'

enableAutoUnmount(afterEach)

type Drone = { id: string; name: string; battery: number | null; locked?: boolean }

const DRONES: Drone[] = [
  { id: 'a', name: 'item 10', battery: 40 },
  { id: 'b', name: 'item 2', battery: null },
  { id: 'c', name: 'Alpha', battery: 90 },
  { id: 'd', name: 'beta', battery: 40, locked: true },
]

/**
 * `DataTableRoot` is generic over its row type, and `h()` cannot be given type
 * arguments — the generic parameter has nowhere to come from, so the props
 * overload does not resolve. Templates infer it; this cast is the cost of
 * building the host with the render function instead.
 */
const Table = DataTableRoot as Component

/* eslint-disable vue/one-component-per-file --
   Throwaway host components. Splitting the file to satisfy a rule about real
   components would scatter one behaviour across several files. */
function makeTable(
  init: {
    rows?: Drone[]
    sort?: SortState
    selection?: string[]
    pageSize?: number
    page?: number
    lockable?: boolean
  } = {},
) {
  const rows = ref(init.rows ?? DRONES)
  const sort = ref<SortState | undefined>(init.sort)
  const selection = ref<string[]>(init.selection ?? [])
  const page = ref(init.page ?? 1)

  const Host = defineComponent({
    setup: () => () =>
      h(
        Table,
        {
          rows: rows.value,
          rowKey: (row: Drone) => row.id,
          getSortValue: (row: Drone, columnId: string) => row[columnId as keyof Drone],
          sort: sort.value,
          selection: selection.value,
          pageSize: init.pageSize,
          page: page.value,
          isRowSelectable: init.lockable ? (row: Drone) => !row.locked : undefined,
          'onUpdate:sort': (next: SortState | undefined) => (sort.value = next),
          'onUpdate:selection': (next: string[]) => (selection.value = next),
          'onUpdate:page': (next: number) => (page.value = next),
        },
        {
          default: ({ rows: visible }: { rows: Drone[] }) =>
            h('table', [
              h('thead', [
                h('tr', [
                  h('th', [h(DataTableSelectAll)]),
                  h(DataTableColumnHeader, { columnId: 'name' }, () => 'Name'),
                  h(DataTableColumnHeader, { columnId: 'battery' }, () => 'Battery'),
                ]),
              ]),
              h(
                'tbody',
                visible.map((row) =>
                  h(
                    DataTableRow,
                    {
                      key: row.id,
                      rowKey: row.id,
                      disabled: init.lockable && row.locked,
                    },
                    () => [
                      h('td', [
                        h(DataTableRowCheckbox, {
                          rowKey: row.id,
                          disabled: init.lockable && row.locked,
                        }),
                      ]),
                      h('td', row.name),
                      h('td', [h('button', 'Open')]),
                    ],
                  ),
                ),
              ),
            ]),
        },
      ),
  })

  return { rows, sort, selection, page, wrapper: mount(Host) }
}

type Wrapper = ReturnType<typeof makeTable>['wrapper']
const names = (w: Wrapper) => w.findAll('tbody tr td:nth-child(2)').map((c) => c.text())
const headers = (w: Wrapper) => w.findAll('th')

describe('sortRows', () => {
  it('compares strings the way a reader reads them', () => {
    const sorted = sortRows(DRONES, (row) => row.name, 'ascending').map((row) => row.name)

    // "item 2" before "item 10", and case does not split the alphabet.
    expect(sorted).toEqual(['Alpha', 'beta', 'item 2', 'item 10'])
  })

  it('keeps missing values last in both directions', () => {
    const up = sortRows(DRONES, (r) => r.battery, 'ascending').map((r) => r.id)
    const down = sortRows(DRONES, (r) => r.battery, 'descending').map((r) => r.id)

    // A blank is not a small value. Flipping the direction to hunt for one is
    // how a user ends up believing the row is gone.
    expect(up.at(-1)).toBe('b')
    expect(down.at(-1)).toBe('b')
  })

  it('is stable, so equal rows keep the order they arrived in', () => {
    const sorted = sortRows(DRONES, (row) => row.battery, 'ascending').map(
      (row) => row.id,
    )

    // 'a' and 'd' both have 40 and were given in that order.
    expect(sorted.indexOf('a')).toBeLessThan(sorted.indexOf('d'))
  })

  it('does not mutate what it was given', () => {
    const input = [...DRONES]
    sortRows(input, (row) => row.name, 'ascending')
    expect(input).toEqual(DRONES)
  })
})

describe('nextSort', () => {
  it('cycles through ascending, descending and back to the given order', () => {
    const first = nextSort(undefined, 'name')
    expect(first).toEqual({ by: 'name', direction: 'ascending' })

    const second = nextSort(first, 'name')
    expect(second).toEqual({ by: 'name', direction: 'descending' })

    // A column that can only be flipped traps the user: once sorted, there is
    // no way back to the order the data arrived in.
    expect(nextSort(second, 'name')).toBeUndefined()
  })

  it('starts a different column fresh', () => {
    expect(nextSort({ by: 'name', direction: 'descending' }, 'battery')).toEqual({
      by: 'battery',
      direction: 'ascending',
    })
  })
})

describe('DataTable sorting', () => {
  it('announces the sort on the header', async () => {
    const { wrapper } = makeTable()
    expect(headers(wrapper)[1]!.attributes('aria-sort')).toBe('none')

    await headers(wrapper)[1]!.get('button').trigger('click')
    expect(headers(wrapper)[1]!.attributes('aria-sort')).toBe('ascending')
    expect(headers(wrapper)[1]!.attributes('data-state')).toBe('ascending')
  })

  it('sorts the rows the slot receives', async () => {
    const { wrapper } = makeTable()
    expect(names(wrapper)).toEqual(['item 10', 'item 2', 'Alpha', 'beta'])

    await headers(wrapper)[1]!.get('button').trigger('click')
    expect(names(wrapper)).toEqual(['Alpha', 'beta', 'item 2', 'item 10'])
  })

  it('sorts through a real button, not a clickable th', () => {
    const { wrapper } = makeTable()

    // A `<th>` with a click handler is invisible to the keyboard, and adding
    // tabindex plus a key handler reimplements a button badly.
    expect(headers(wrapper)[1]!.find('button').exists()).toBe(true)
  })
})

describe('DataTable selection', () => {
  it('selects a row by clicking it', async () => {
    const { selection, wrapper } = makeTable()
    await wrapper.findAll('tbody tr')[0]!.trigger('click')

    expect(selection.value).toEqual(['a'])
    expect(wrapper.findAll('tbody tr')[0]!.attributes('aria-selected')).toBe('true')
  })

  it('leaves controls inside the row alone', async () => {
    const { selection, wrapper } = makeTable()
    await wrapper.findAll('tbody tr')[0]!.get('td:nth-child(3) button').trigger('click')

    // Row selection is what is left over after the row's own controls, not an
    // override of them.
    expect(selection.value).toEqual([])
  })

  it('selects a range with Shift', async () => {
    const { selection, wrapper } = makeTable()
    const rows = wrapper.findAll('tbody tr')

    await rows[0]!.trigger('click')
    await rows[2]!.trigger('click', { shiftKey: true })

    expect(selection.value).toEqual(['a', 'b', 'c'])
  })

  it('runs the range over the rows as displayed, not as given', async () => {
    const { selection, wrapper } = makeTable({
      sort: { by: 'name', direction: 'ascending' },
    })
    const rows = wrapper.findAll('tbody tr')

    // Displayed order is Alpha, beta, item 2, item 10.
    await rows[0]!.trigger('click')
    await rows[1]!.trigger('click', { shiftKey: true })

    expect(selection.value).toEqual(['c', 'd'])
  })

  it('selects everything from the header box, and clears it again', async () => {
    const { selection, wrapper } = makeTable()
    const all = wrapper.get('thead input')

    await all.trigger('change')
    expect(selection.value).toEqual(['a', 'b', 'c', 'd'])

    await all.trigger('change')
    expect(selection.value).toEqual([])
  })

  it('shows the header box as mixed while only some are selected', async () => {
    const { wrapper } = makeTable({ selection: ['a'] })
    // The indeterminate property is written after the DOM is patched.
    await wrapper.vm.$nextTick()
    const all = wrapper.get('thead input')

    expect(all.attributes('aria-checked')).toBe('mixed')
    expect(all.attributes('data-state')).toBe('indeterminate')
    // `indeterminate` is a property with no attribute, which is the whole
    // reason this part exists.
    expect((all.element as HTMLInputElement).indeterminate).toBe(true)
  })

  it('skips rows that cannot be selected', async () => {
    const { selection, wrapper } = makeTable({ lockable: true })

    await wrapper.get('thead input').trigger('change')
    expect(selection.value).toEqual(['a', 'b', 'c'])

    await wrapper.findAll('tbody tr')[3]!.trigger('click')
    expect(selection.value).toEqual(['a', 'b', 'c'])
  })

  it('keeps the selection when the sort changes', async () => {
    const { selection, wrapper } = makeTable()
    await wrapper.findAll('tbody tr')[0]!.trigger('click')
    await headers(wrapper)[1]!.get('button').trigger('click')

    // Keys, not indices: a selection stored by position would follow whichever
    // row happened to land there.
    expect(selection.value).toEqual(['a'])
  })
})

describe('DataTable paging', () => {
  it('slices the rows and reports the count', () => {
    const { wrapper } = makeTable({ pageSize: 2 })

    expect(names(wrapper)).toEqual(['item 10', 'item 2'])
  })

  it('clamps a page past the end when the data shrinks', async () => {
    const { rows, page, wrapper } = makeTable({ pageSize: 2, page: 2 })
    expect(names(wrapper)).toEqual(['Alpha', 'beta'])

    rows.value = DRONES.slice(0, 2)
    await wrapper.vm.$nextTick()

    // Page 2 of 1 renders an empty table that looks like a loading bug.
    expect(page.value).toBe(1)
    expect(names(wrapper)).toEqual(['item 10', 'item 2'])
  })

  it('returns to the first page when the sort changes', async () => {
    const { page, wrapper } = makeTable({ pageSize: 2, page: 2 })
    await headers(wrapper)[1]!.get('button').trigger('click')

    // The row someone was looking at is not on page 2 any more.
    expect(page.value).toBe(1)
  })
})

describe('DataTable parts outside their root', () => {
  it('fails loudly', () => {
    const Orphan = defineComponent({
      setup: () => () => h(DataTableColumnHeader, { columnId: 'name' }),
    })
    expect(() => mount(Orphan)).toThrowError(/outside <DataTableRoot>/)
  })
})
