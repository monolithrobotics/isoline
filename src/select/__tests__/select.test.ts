import { describe, it, expect } from 'vitest'
import { enableAutoUnmount, mount } from '@vue/test-utils'
import { defineComponent, h, nextTick, ref } from 'vue'
import SelectRoot from '../SelectRoot.vue'
import SelectTrigger from '../SelectTrigger.vue'
import SelectPortal from '../SelectPortal.vue'
import SelectContent from '../SelectContent.vue'
import SelectItem from '../SelectItem.vue'
import SelectItemIndicator from '../SelectItemIndicator.vue'

enableAutoUnmount(afterEach)

type Option = { value: string; label: string; disabled?: boolean }

const OPTIONS: Option[] = [
  { value: 'apple', label: 'Apple' },
  { value: 'apricot', label: 'Apricot' },
  { value: 'banana', label: 'Banana' },
]

/* eslint-disable vue/one-component-per-file --
   Throwaway host components, one per wiring under test. Splitting the file to
   satisfy a rule about real components would scatter one behaviour across
   several files. */
function makeSelect(
  init: { value?: string; open?: boolean; options?: Option[]; name?: string } = {},
) {
  const value = ref(init.value)
  const open = ref(init.open ?? false)
  const options = init.options ?? OPTIONS

  const Host = defineComponent({
    setup: () => () =>
      h(
        SelectRoot,
        {
          modelValue: value.value,
          open: open.value,
          name: init.name,
          'onUpdate:modelValue': (next: string) => (value.value = next),
          'onUpdate:open': (next: boolean) => (open.value = next),
        },
        () => [
          h(SelectTrigger, () => value.value ?? 'Pick one'),
          h(SelectPortal, { disabled: true }, () =>
            h(SelectContent, () =>
              options.map((option) =>
                h(SelectItem, { ...option, key: option.value }, () => [
                  option.label,
                  h(SelectItemIndicator, () => '✓'),
                ]),
              ),
            ),
          ),
        ],
      ),
  })

  return { value, open, wrapper: mount(Host, { attachTo: document.body }) }
}

const trigger = (w: ReturnType<typeof makeSelect>['wrapper']) =>
  w.get('[role="combobox"]')
const options = (w: ReturnType<typeof makeSelect>['wrapper']) =>
  w.findAll('[role="option"]')

async function press(w: ReturnType<typeof makeSelect>['wrapper'], key: string) {
  await trigger(w).trigger('keydown', { key })
  await nextTick()
}

describe('SelectTrigger', () => {
  it('describes the popup it controls', async () => {
    const { wrapper } = makeSelect()
    expect(trigger(wrapper).attributes('aria-expanded')).toBe('false')
    // Nothing to control while the list is unrendered: pointing at an absent
    // id is a dangling reference every a11y checker flags.
    expect(trigger(wrapper).attributes('aria-controls')).toBeUndefined()

    await trigger(wrapper).trigger('click')
    expect(trigger(wrapper).attributes('aria-expanded')).toBe('true')
    expect(trigger(wrapper).attributes('aria-controls')).toBe(
      wrapper.get('[role="listbox"]').attributes('id'),
    )
  })

  it('keeps focus and announces the highlight through aria-activedescendant', async () => {
    const { wrapper } = makeSelect()
    await trigger(wrapper).trigger('click')
    await nextTick()

    expect(trigger(wrapper).attributes('aria-activedescendant')).toBe(
      options(wrapper)[0]?.attributes('id'),
    )
  })

  it('toggles shut on a second click', async () => {
    const { open, wrapper } = makeSelect()
    await trigger(wrapper).trigger('click')
    await trigger(wrapper).trigger('click')

    expect(open.value).toBe(false)
  })
})

describe('Select opening', () => {
  it('opens with the highlight on the current selection', async () => {
    const { wrapper } = makeSelect({ value: 'banana' })
    await trigger(wrapper).trigger('click')
    await nextTick()

    expect(trigger(wrapper).attributes('aria-activedescendant')).toBe(
      options(wrapper)[2]?.attributes('id'),
    )
  })

  it('opens from the keyboard, at whichever end the arrow implies', async () => {
    const { open, wrapper } = makeSelect()

    await press(wrapper, 'ArrowUp')
    expect(open.value).toBe(true)
    expect(trigger(wrapper).attributes('aria-activedescendant')).toBe(
      options(wrapper)[2]?.attributes('id'),
    )
  })
})

describe('Select keyboard', () => {
  it('moves the highlight and stops at the ends', async () => {
    const { wrapper } = makeSelect({ open: true })
    await press(wrapper, 'ArrowDown')
    await press(wrapper, 'ArrowDown')
    expect(trigger(wrapper).attributes('aria-activedescendant')).toBe(
      options(wrapper)[1]?.attributes('id'),
    )

    await press(wrapper, 'Home')
    await press(wrapper, 'ArrowUp')
    // A list is not a radio group: native selects stop at the top rather than
    // wrapping round to the bottom.
    expect(trigger(wrapper).attributes('aria-activedescendant')).toBe(
      options(wrapper)[0]?.attributes('id'),
    )

    await press(wrapper, 'End')
    expect(trigger(wrapper).attributes('aria-activedescendant')).toBe(
      options(wrapper)[2]?.attributes('id'),
    )
  })

  it('selects the highlighted option and closes', async () => {
    const { value, open, wrapper } = makeSelect({ open: true })
    await press(wrapper, 'ArrowDown')
    await press(wrapper, 'Enter')

    expect(value.value).toBe('apple')
    expect(open.value).toBe(false)
  })

  it('closes on Escape without changing the value', async () => {
    const { value, open, wrapper } = makeSelect({ open: true, value: 'apple' })
    await press(wrapper, 'ArrowDown')
    await press(wrapper, 'Escape')

    expect(open.value).toBe(false)
    expect(value.value).toBe('apple')
  })

  it('closes on Tab rather than trapping', async () => {
    const { open, wrapper } = makeSelect({ open: true })
    await press(wrapper, 'Tab')

    expect(open.value).toBe(false)
  })

  it('skips disabled options', async () => {
    const { wrapper } = makeSelect({
      open: true,
      options: [OPTIONS[0]!, { ...OPTIONS[1]!, disabled: true }, OPTIONS[2]!],
    })
    await press(wrapper, 'ArrowDown')
    await press(wrapper, 'ArrowDown')

    expect(trigger(wrapper).attributes('aria-activedescendant')).toBe(
      options(wrapper)[2]?.attributes('id'),
    )
  })
})

describe('Select typeahead', () => {
  it('highlights the first match while open', async () => {
    const { wrapper } = makeSelect({ open: true })
    // Let the opening highlight settle first, or it lands after the keypress
    // and overwrites what typeahead found.
    await nextTick()
    await press(wrapper, 'b')

    expect(trigger(wrapper).attributes('aria-activedescendant')).toBe(
      options(wrapper)[2]?.attributes('id'),
    )
  })

  it('walks through same-letter matches on repeat presses', async () => {
    const { wrapper } = makeSelect({ open: true })
    await nextTick()

    // Opening lands on Apple, so the first `a` moves on rather than matching
    // where the highlight already is — as a native select does.
    await press(wrapper, 'a')
    expect(trigger(wrapper).attributes('aria-activedescendant')).toBe(
      options(wrapper)[1]?.attributes('id'),
    )

    // Only Apple and Apricot start with `a`, so a third press comes back round
    // to Apple rather than searching for "aa" and finding nothing.
    await press(wrapper, 'a')
    expect(trigger(wrapper).attributes('aria-activedescendant')).toBe(
      options(wrapper)[0]?.attributes('id'),
    )
  })

  it('narrows on a longer string', async () => {
    const { wrapper } = makeSelect({ open: true })
    await press(wrapper, 'a')
    await press(wrapper, 'p')
    await press(wrapper, 'r')

    expect(trigger(wrapper).attributes('aria-activedescendant')).toBe(
      options(wrapper)[1]?.attributes('id'),
    )
  })

  it('opens and searches when typing starts on a closed trigger', async () => {
    const { open, wrapper } = makeSelect()
    await press(wrapper, 'b')
    await nextTick()

    // The options do not exist while the list is closed, so there is nothing
    // to search until it opens — opening is the honest answer.
    expect(open.value).toBe(true)
    expect(trigger(wrapper).attributes('aria-activedescendant')).toBe(
      options(wrapper)[2]?.attributes('id'),
    )
  })
})

describe('SelectItem', () => {
  it('marks the selected option and shows its indicator', async () => {
    const { wrapper } = makeSelect({ open: true, value: 'apricot' })

    expect(options(wrapper).map((o) => o.attributes('aria-selected'))).toEqual([
      'false',
      'true',
      'false',
    ])
    expect(wrapper.findAll('span')).toHaveLength(1)
  })

  it('selects on pointerup, so a press that began on the trigger still lands', async () => {
    const { value, open, wrapper } = makeSelect({ open: true })
    await options(wrapper)[1]!.trigger('pointerup')

    expect(value.value).toBe('apricot')
    expect(open.value).toBe(false)
  })

  it('ignores a disabled option', async () => {
    const { value, wrapper } = makeSelect({
      open: true,
      options: [{ ...OPTIONS[0]!, disabled: true }, OPTIONS[1]!],
    })
    await options(wrapper)[0]!.trigger('pointerup')

    expect(value.value).toBeUndefined()
  })

  it('follows the mouse, so Enter picks what the pointer is on', async () => {
    const { wrapper } = makeSelect({ open: true })
    await nextTick()
    await options(wrapper)[2]!.trigger('pointermove')

    expect(trigger(wrapper).attributes('aria-activedescendant')).toBe(
      options(wrapper)[2]?.attributes('id'),
    )
  })
})

describe('Select outside press', () => {
  it('closes when the press lands elsewhere', async () => {
    const { open, wrapper } = makeSelect({ open: true })
    await nextTick()

    document.body.dispatchEvent(new Event('pointerdown', { bubbles: true }))
    await nextTick()

    expect(open.value).toBe(false)
    expect(wrapper.exists()).toBe(true)
  })

  it('stays open for a press inside the list', async () => {
    const { open, wrapper } = makeSelect({ open: true })
    await nextTick()

    options(wrapper)[0]!.element.dispatchEvent(
      new Event('pointerdown', { bubbles: true }),
    )
    await nextTick()

    expect(open.value).toBe(true)
  })
})

describe('Select form participation', () => {
  it('renders no mirror when there is no name to submit under', () => {
    const { wrapper } = makeSelect()
    expect(wrapper.find('select').exists()).toBe(false)
  })

  it('mirrors the selection into a real select, so required still validates', () => {
    const { wrapper } = makeSelect({ name: 'fruit', value: 'banana' })
    const mirror = wrapper.get('select')

    expect(mirror.attributes('name')).toBe('fruit')
    expect((mirror.element as HTMLSelectElement).value).toBe('banana')
  })
})

describe('Select parts outside their root', () => {
  it('fails loudly for an item outside the root', () => {
    const Orphan = defineComponent({ setup: () => () => h(SelectItem, { value: 'a' }) })
    expect(() => mount(Orphan)).toThrowError(/outside <SelectRoot>/)
  })

  it('fails loudly for an indicator outside an item', () => {
    const Orphan = defineComponent({ setup: () => () => h(SelectItemIndicator) })
    expect(() => mount(Orphan)).toThrowError(/outside <SelectItem>/)
  })
})
