import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { enableAutoUnmount, mount } from '@vue/test-utils'
import { defineComponent, h, nextTick, ref } from 'vue'
import DatePickerRoot from '../DatePickerRoot.vue'
import DatePickerGrid from '../DatePickerGrid.vue'
import DatePickerCell from '../DatePickerCell.vue'
import DatePickerNav from '../DatePickerNav.vue'
import type { DatePickerDay } from '../context'
import { addMonths, monthGrid } from '../../shared/date'

enableAutoUnmount(afterEach)

// A fixed "today" so "is this cell today?" does not depend on the day the
// suite happens to run.
const TODAY = new Date(2026, 2, 18)

beforeEach(() => vi.setSystemTime(TODAY))
afterEach(() => vi.useRealTimers())

/* eslint-disable vue/one-component-per-file --
   Throwaway host components. Splitting the file to satisfy a rule about real
   components would scatter one behaviour across several files. */
function makePicker(props: Record<string, unknown> = {}) {
  vi.useFakeTimers()
  vi.setSystemTime(TODAY)

  const value = ref<Date | undefined>(props.modelValue as Date | undefined)

  const Host = defineComponent({
    setup: () => () =>
      h(
        DatePickerRoot,
        {
          ...props,
          modelValue: value.value,
          'onUpdate:modelValue': (next: Date) => (value.value = next),
        },
        {
          default: ({ weeks }: { weeks: DatePickerDay[][] }) => [
            h(DatePickerNav, { months: -1 }, () => 'Prev'),
            h(DatePickerNav, { months: 1 }, () => 'Next'),
            h(DatePickerGrid, () =>
              h(
                'tbody',
                weeks.map((week, i) =>
                  h(
                    'tr',
                    { key: i },
                    week.map((day) => h(DatePickerCell, { key: +day.date, day })),
                  ),
                ),
              ),
            ),
          ],
        },
      ),
  })

  return { value, wrapper: mount(Host, { attachTo: document.body }) }
}

type Wrapper = ReturnType<typeof makePicker>['wrapper']
const cells = (w: Wrapper) => w.findAll('td button')
/**
 * The cell for a day of the month on screen.
 *
 * The comparison is against `undefined`, not falsiness: a present
 * `data-outside-month` is the empty string, and `!''` would let February's 26th
 * answer for March's.
 */
const cellFor = (w: Wrapper, day: number) =>
  cells(w).find(
    (c) => c.text() === String(day) && c.attributes('data-outside-month') === undefined,
  )!
const grid = (w: Wrapper) => w.get('[role="grid"]')

describe('monthGrid', () => {
  it('always returns whole weeks', () => {
    const weeks = monthGrid(new Date(2026, 2, 1))

    // A ragged first row cannot be arrowed through — Up from the 3rd would
    // have nowhere to go — and reads as blank cells to a screen reader.
    expect(weeks.every((week) => week.length === 7)).toBe(true)
  })

  it('starts each week on the requested day', () => {
    expect(monthGrid(new Date(2026, 2, 1), 1)[0]![0]!.getDay()).toBe(1)
    expect(monthGrid(new Date(2026, 2, 1), 0)[0]![0]!.getDay()).toBe(0)
  })
})

describe('addMonths', () => {
  it('clamps rather than overflowing into the month after next', () => {
    const result = addMonths(new Date(2026, 0, 31), 1)

    // 31 January + 1 month is 28 February. `setMonth` would give 3 March and
    // skip February entirely.
    expect([result.getMonth(), result.getDate()]).toEqual([1, 28])
  })
})

describe('DatePicker grid', () => {
  it('is a real grid, so a cell is announced with its column header', () => {
    const { wrapper } = makePicker()

    expect(grid(wrapper).element.tagName.toLowerCase()).toBe('table')
    expect(wrapper.findAll('[role="gridcell"]').length).toBeGreaterThan(27)
  })

  it('marks today and the selection separately', () => {
    const { wrapper } = makePicker({ modelValue: new Date(2026, 2, 10) })

    expect(cellFor(wrapper, 18).attributes('data-today')).toBe('')
    expect(cellFor(wrapper, 18).attributes('data-state')).toBe('unselected')
    expect(cellFor(wrapper, 10).attributes('data-state')).toBe('selected')
    expect(cellFor(wrapper, 10).attributes('aria-current')).toBeUndefined()
  })

  it('flags the days that only fill out the week', () => {
    const { wrapper } = makePicker()
    const outside = cells(wrapper).filter(
      (c) => c.attributes('data-outside-month') === '',
    )

    expect(outside.length).toBeGreaterThan(0)
  })
})

describe('DatePicker roving tab stop', () => {
  it('gives the whole month exactly one tab stop', () => {
    const { wrapper } = makePicker({ modelValue: new Date(2026, 2, 10) })
    const tabbable = cells(wrapper).filter((c) => c.attributes('tabindex') === '0')

    // Thirty-one tab stops is not navigation, it is an obstacle.
    expect(tabbable).toHaveLength(1)
    expect(tabbable[0]!.text()).toBe('10')
  })

  it('starts on today when nothing is chosen', () => {
    const { wrapper } = makePicker()
    expect(cellFor(wrapper, 18).attributes('tabindex')).toBe('0')
  })
})

describe('DatePicker keyboard', () => {
  it('moves by day and by week', async () => {
    const { wrapper } = makePicker()

    await grid(wrapper).trigger('keydown', { key: 'ArrowRight' })
    expect(cellFor(wrapper, 19).attributes('tabindex')).toBe('0')

    await grid(wrapper).trigger('keydown', { key: 'ArrowDown' })
    expect(cellFor(wrapper, 26).attributes('tabindex')).toBe('0')
  })

  it('pages the view when the arrows leave the month', async () => {
    const { wrapper } = makePicker({ modelValue: new Date(2026, 2, 31) })

    await grid(wrapper).trigger('keydown', { key: 'ArrowRight' })
    await nextTick()

    // The focused day must stay on screen, so the view follows it into April.
    expect(cellFor(wrapper, 1).attributes('tabindex')).toBe('0')
    expect(wrapper.findAll('td button').some((c) => c.text() === '30')).toBe(true)
  })

  it('moves by month with the page keys, and by year with Shift', async () => {
    const { wrapper } = makePicker()

    await grid(wrapper).trigger('keydown', { key: 'PageDown' })
    await nextTick()
    expect(cellFor(wrapper, 18).attributes('tabindex')).toBe('0')

    await grid(wrapper).trigger('keydown', { key: 'PageUp', shiftKey: true })
    await nextTick()
    expect(cellFor(wrapper, 18).attributes('tabindex')).toBe('0')
  })

  it('goes to the ends of the week, not of the month', async () => {
    const { wrapper } = makePicker()

    // 18 March 2026 is a Wednesday; its week runs Monday 16 to Sunday 22.
    await grid(wrapper).trigger('keydown', { key: 'Home' })
    expect(cellFor(wrapper, 16).attributes('tabindex')).toBe('0')

    await grid(wrapper).trigger('keydown', { key: 'End' })
    expect(cellFor(wrapper, 22).attributes('tabindex')).toBe('0')
  })

  it('selects with Enter', async () => {
    const { value, wrapper } = makePicker()
    await grid(wrapper).trigger('keydown', { key: 'ArrowRight' })
    await grid(wrapper).trigger('keydown', { key: 'Enter' })

    expect(value.value?.getDate()).toBe(19)
  })
})

describe('DatePicker selection', () => {
  it('selects on click and moves the keyboard with the pointer', async () => {
    const { value, wrapper } = makePicker()
    await cellFor(wrapper, 5).trigger('click')

    expect(value.value?.getDate()).toBe(5)
    expect(cellFor(wrapper, 5).attributes('tabindex')).toBe('0')
  })

  it('emits midnight local time, never a UTC-shifted instant', async () => {
    const { value, wrapper } = makePicker()
    await cellFor(wrapper, 5).trigger('click')

    expect([value.value?.getHours(), value.value?.getMinutes()]).toEqual([0, 0])
  })

  it('follows the view to a value set from outside', async () => {
    const { value, wrapper } = makePicker()
    value.value = new Date(2026, 6, 4)
    await nextTick()

    // A preset button or a form reset must not leave the calendar showing a
    // month that no longer holds the selection.
    expect(cellFor(wrapper, 4).attributes('tabindex')).toBe('0')
    expect(cellFor(wrapper, 4).attributes('data-state')).toBe('selected')
  })
})

describe('DatePicker limits', () => {
  it('disables days outside min and max', () => {
    const { wrapper } = makePicker({
      min: new Date(2026, 2, 10),
      max: new Date(2026, 2, 20),
    })

    expect(cellFor(wrapper, 9).attributes('disabled')).toBeDefined()
    expect(cellFor(wrapper, 10).attributes('disabled')).toBeUndefined()
    expect(cellFor(wrapper, 21).attributes('disabled')).toBeDefined()
  })

  it('takes a predicate for irregular gaps', () => {
    const { wrapper } = makePicker({
      isDateDisabled: (date: Date) => date.getDay() === 0 || date.getDay() === 6,
    })

    // 21 and 22 March 2026 are Saturday and Sunday.
    expect(cellFor(wrapper, 21).attributes('disabled')).toBeDefined()
    expect(cellFor(wrapper, 20).attributes('disabled')).toBeUndefined()
  })

  it('refuses to select a disabled day', async () => {
    const { value, wrapper } = makePicker({ min: new Date(2026, 2, 10) })
    await cellFor(wrapper, 5).trigger('click')

    expect(value.value).toBeUndefined()
  })
})

describe('DatePickerNav', () => {
  it('moves the view without touching the selection', async () => {
    const { value, wrapper } = makePicker({ modelValue: new Date(2026, 2, 10) })
    await wrapper.findAll('button')[1]!.trigger('click')
    await nextTick()

    expect(value.value).toEqual(new Date(2026, 2, 10))
    // April is on screen; March's 10th is not the selected cell here.
    expect(wrapper.findAll('td button').some((c) => c.text() === '30')).toBe(true)
  })

  it('fails loudly outside its root', () => {
    const Orphan = defineComponent({ setup: () => () => h(DatePickerNav) })
    expect(() => mount(Orphan)).toThrowError(/outside <DatePickerRoot>/)
  })
})
