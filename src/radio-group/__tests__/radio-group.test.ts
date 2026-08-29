import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h, nextTick } from 'vue'
import RadioGroupRoot from '../RadioGroupRoot.vue'
import RadioGroupItem from '../RadioGroupItem.vue'
import RadioGroupIndicator from '../RadioGroupIndicator.vue'

type ItemSpec = { value: string; disabled?: boolean }

const OPTIONS: ItemSpec[] = [{ value: 'a' }, { value: 'b' }, { value: 'c' }]

function mountGroup(props: Record<string, unknown> = {}, options: ItemSpec[] = OPTIONS) {
  return mount(RadioGroupRoot, {
    props,
    slots: {
      default: () =>
        options.map((option) =>
          h(RadioGroupItem, { ...option, key: option.value }, () =>
            h(RadioGroupIndicator),
          ),
        ),
    },
    // Focus and `document.activeElement` are only meaningful for an element
    // that is actually in the document.
    attachTo: document.body,
  })
}

/**
 * One radio by position.
 *
 * Indexing `findAll` yields `T | undefined` under `noUncheckedIndexedAccess`,
 * and a test that quietly does nothing when the element is missing is worse
 * than one that says so here.
 */
function radio(wrapper: ReturnType<typeof mountGroup>, index: number) {
  const items = wrapper.findAll('[role="radio"]')
  const item = items[index]
  if (!item)
    throw new Error(`No radio at index ${index}; the group rendered ${items.length}.`)
  return item
}

describe('RadioGroupRoot', () => {
  it('announces itself as a radiogroup with an orientation', () => {
    const root = mountGroup().get('[role="radiogroup"]')

    expect(root.attributes('aria-orientation')).toBe('vertical')
    expect(root.attributes('data-orientation')).toBe('vertical')
  })

  it('marks exactly the selected item as checked', async () => {
    const wrapper = mountGroup({ modelValue: 'b' })
    const states = wrapper
      .findAll('[role="radio"]')
      .map((i) => i.attributes('data-state'))

    expect(states).toEqual(['unchecked', 'checked', 'unchecked'])
  })

  it('emits on click without mutating its own prop', async () => {
    const wrapper = mountGroup({ modelValue: 'a' })
    await radio(wrapper, 2).trigger('click')

    expect(wrapper.emitted('update:modelValue')).toEqual([['c']])
    expect(radio(wrapper, 0).attributes('data-state')).toBe('checked')
  })

  it('stays quiet when the same value is clicked again', async () => {
    const wrapper = mountGroup({ modelValue: 'a' })
    await radio(wrapper, 0).trigger('click')

    // Radios do not deselect, and re-emitting an unchanged value makes every
    // watcher downstream fire for nothing.
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
  })

  it('disables every item when the group is disabled', async () => {
    const wrapper = mountGroup({ disabled: true })
    const items = wrapper.findAll('[role="radio"]')

    expect(items.every((i) => i.attributes('disabled') !== undefined)).toBe(true)
    expect(items.every((i) => i.attributes('data-disabled') === '')).toBe(true)

    await radio(wrapper, 0).trigger('click')
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
  })
})

describe('RadioGroup roving tab stop', () => {
  it('gives the group one tab stop, on the selected item', () => {
    const wrapper = mountGroup({ modelValue: 'b' })
    const tabindexes = wrapper
      .findAll('[role="radio"]')
      .map((i) => i.attributes('tabindex'))

    expect(tabindexes).toEqual(['-1', '0', '-1'])
  })

  it('falls back to the first enabled item while nothing is selected', async () => {
    const wrapper = mountGroup({}, [
      { value: 'a', disabled: true },
      { value: 'b' },
      { value: 'c' },
    ])
    // Items report their element on mount, so which one comes first is only
    // knowable a tick later. That patch lands before the browser paints, and
    // long before anyone can press Tab.
    await nextTick()
    const tabindexes = wrapper
      .findAll('[role="radio"]')
      .map((i) => i.attributes('tabindex'))

    // Never all `-1`: a group the keyboard cannot enter is a group that does
    // not exist for anyone not using a mouse.
    expect(tabindexes).toEqual(['-1', '0', '-1'])
  })
})

describe('RadioGroup keyboard navigation', () => {
  it('selects as it moves, in both arrow directions', async () => {
    const wrapper = mountGroup({ modelValue: 'a' })
    await radio(wrapper, 0).trigger('keydown', { key: 'ArrowDown' })
    expect(wrapper.emitted('update:modelValue')).toEqual([['b']])

    await radio(wrapper, 0).trigger('keydown', { key: 'ArrowUp' })
    // Wraps to the end: `loop` defaults to true, as native radios do.
    expect(wrapper.emitted('update:modelValue')).toEqual([['b'], ['c']])
  })

  it('treats horizontal and vertical arrows alike', async () => {
    const wrapper = mountGroup({ modelValue: 'a' })

    await radio(wrapper, 0).trigger('keydown', { key: 'ArrowRight' })
    expect(wrapper.emitted('update:modelValue')).toEqual([['b']])
  })

  it('stops at the ends when loop is off', async () => {
    const wrapper = mountGroup({ modelValue: 'a', loop: false })

    await radio(wrapper, 0).trigger('keydown', { key: 'ArrowUp' })
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
  })

  it('skips disabled items rather than landing on them', async () => {
    const wrapper = mountGroup({ modelValue: 'a' }, [
      { value: 'a' },
      { value: 'b', disabled: true },
      { value: 'c' },
    ])

    await radio(wrapper, 0).trigger('keydown', { key: 'ArrowDown' })
    expect(wrapper.emitted('update:modelValue')).toEqual([['c']])
  })

  it('moves focus along with the selection', async () => {
    const wrapper = mountGroup({ modelValue: 'a' })
    await radio(wrapper, 0).trigger('keydown', { key: 'ArrowDown' })
    expect(document.activeElement).toBe(radio(wrapper, 1).element)
  })
})

describe('RadioGroup form participation', () => {
  it('renders no hidden input when there is no name to submit under', () => {
    expect(mountGroup().find('input[type="radio"]').exists()).toBe(false)
  })

  it('mirrors the selection when named', async () => {
    const wrapper = mountGroup({ name: 'mode', modelValue: 'b' })
    const input = wrapper.get('input[type="radio"]')

    expect(input.attributes('name')).toBe('mode')
    expect((input.element as HTMLInputElement).value).toBe('b')
    expect((input.element as HTMLInputElement).checked).toBe(true)
  })

  it('leaves the mirror unchecked while nothing is selected, so required fails', () => {
    const wrapper = mountGroup({ name: 'mode', required: true })
    const input = wrapper.get('input[type="radio"]')

    expect((input.element as HTMLInputElement).checked).toBe(false)
    expect(input.attributes('required')).toBeDefined()
  })
})

describe('RadioGroup parts outside their parent', () => {
  /* eslint-disable vue/one-component-per-file --
     Two throwaway components, one per orphaned part. Splitting the file to
     satisfy a rule about real components would scatter one behaviour across
     three files. */
  it('fails loudly for an item outside the group', () => {
    const Orphan = defineComponent({
      setup: () => () => h(RadioGroupItem, { value: 'a' }),
    })

    expect(() => mount(Orphan)).toThrowError(/outside <RadioGroupRoot>/)
  })

  it('fails loudly for an indicator outside an item', () => {
    const Orphan = defineComponent({ setup: () => () => h(RadioGroupIndicator) })

    expect(() => mount(Orphan)).toThrowError(/outside <RadioGroupItem>/)
  })
})
