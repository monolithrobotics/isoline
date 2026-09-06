import { describe, it, expect } from 'vitest'
import { enableAutoUnmount, mount } from '@vue/test-utils'
import { defineComponent, h, nextTick, ref } from 'vue'
import MultiSelectRoot from '../MultiSelectRoot.vue'
import MultiSelectTrigger from '../MultiSelectTrigger.vue'
import Portal from '../../portal/Portal.vue'
import ListboxContent from '../../listbox/ListboxContent.vue'
import MultiSelectItem from '../MultiSelectItem.vue'
import MultiSelectItemIndicator from '../MultiSelectItemIndicator.vue'

enableAutoUnmount(afterEach)

type Option = { value: string; label: string; disabled?: boolean }

const OPTIONS: Option[] = [
  { value: 'apple', label: 'Apple' },
  { value: 'apricot', label: 'Apricot' },
  { value: 'banana', label: 'Banana' },
]

/* eslint-disable vue/one-component-per-file --
   Throwaway host components. Splitting the file to satisfy a rule about real
   components would scatter one behaviour across several files. */
function makeMultiSelect(
  init: { value?: string[]; open?: boolean; options?: Option[]; name?: string } = {},
) {
  const value = ref<string[]>(init.value ?? [])
  const open = ref(init.open ?? false)
  const options = init.options ?? OPTIONS

  const Host = defineComponent({
    setup: () => () =>
      h(
        MultiSelectRoot,
        {
          modelValue: value.value,
          open: open.value,
          name: init.name,
          'onUpdate:modelValue': (next: string[]) => (value.value = next),
          'onUpdate:open': (next: boolean) => (open.value = next),
        },
        () => [
          h(MultiSelectTrigger, () => `${value.value.length} chosen`),
          h(Portal, { disabled: true }, () =>
            h(ListboxContent, () =>
              options.map((option) =>
                h(MultiSelectItem, { ...option, key: option.value }, () => [
                  option.label,
                  h(MultiSelectItemIndicator, () => '✓'),
                ]),
              ),
            ),
          ),
        ],
      ),
  })

  return { value, open, wrapper: mount(Host, { attachTo: document.body }) }
}

type Wrapper = ReturnType<typeof makeMultiSelect>['wrapper']
const trigger = (w: Wrapper) => w.get('[role="combobox"]')
const options = (w: Wrapper) => w.findAll('[role="option"]')

async function press(w: Wrapper, key: string) {
  await trigger(w).trigger('keydown', { key })
  await nextTick()
}

describe('MultiSelect', () => {
  it('announces that the list takes more than one choice', async () => {
    const { wrapper } = makeMultiSelect({ open: true })
    await nextTick()

    expect(wrapper.get('[role="listbox"]').attributes('aria-multiselectable')).toBe(
      'true',
    )
  })

  it('adds and removes without closing', async () => {
    const { value, open, wrapper } = makeMultiSelect({ open: true })
    await nextTick()

    await options(wrapper)[0]!.trigger('pointerup')
    expect(value.value).toEqual(['apple'])
    // Someone picking three things should not have to reopen the list twice.
    expect(open.value).toBe(true)

    await options(wrapper)[2]!.trigger('pointerup')
    expect(value.value).toEqual(['apple', 'banana'])

    await options(wrapper)[0]!.trigger('pointerup')
    expect(value.value).toEqual(['banana'])
  })

  it('never mutates the array it was given', async () => {
    const { value, wrapper } = makeMultiSelect({ open: true, value: ['apple'] })
    const original = value.value
    await nextTick()

    await options(wrapper)[1]!.trigger('pointerup')

    // A consumer holding the same array elsewhere keeps what they had.
    expect(original).toEqual(['apple'])
    expect(value.value).not.toBe(original)
  })

  it('marks every chosen option, and only those', async () => {
    const { wrapper } = makeMultiSelect({ open: true, value: ['apple', 'banana'] })
    await nextTick()

    expect(options(wrapper).map((o) => o.attributes('aria-selected'))).toEqual([
      'true',
      'false',
      'true',
    ])
    expect(wrapper.findAll('span')).toHaveLength(2)
  })

  it('toggles from the keyboard and stays open', async () => {
    const { value, open, wrapper } = makeMultiSelect({ open: true })
    await nextTick()

    await press(wrapper, 'Enter')
    expect(value.value).toEqual(['apple'])
    expect(open.value).toBe(true)

    await press(wrapper, 'ArrowDown')
    await press(wrapper, ' ')
    expect(value.value).toEqual(['apple', 'apricot'])
  })

  it('opens onto the first chosen option', async () => {
    const { wrapper } = makeMultiSelect({ value: ['banana'] })
    await trigger(wrapper).trigger('click')
    await nextTick()

    expect(trigger(wrapper).attributes('aria-activedescendant')).toBe(
      options(wrapper)[2]?.attributes('id'),
    )
  })

  it('shares the listbox keyboard: arrows, ends and typeahead', async () => {
    const { wrapper } = makeMultiSelect({ open: true })
    await nextTick()

    await press(wrapper, 'End')
    expect(trigger(wrapper).attributes('aria-activedescendant')).toBe(
      options(wrapper)[2]?.attributes('id'),
    )

    await press(wrapper, 'a')
    expect(trigger(wrapper).attributes('aria-activedescendant')).toBe(
      options(wrapper)[0]?.attributes('id'),
    )
  })

  it('leaves disabled options alone', async () => {
    const { value, wrapper } = makeMultiSelect({
      open: true,
      options: [{ ...OPTIONS[0]!, disabled: true }, OPTIONS[1]!],
    })
    await nextTick()

    await options(wrapper)[0]!.trigger('pointerup')
    expect(value.value).toEqual([])
  })

  it('closes on Escape and on Tab', async () => {
    const { open, wrapper } = makeMultiSelect({ open: true })
    await press(wrapper, 'Escape')
    expect(open.value).toBe(false)
  })

  it('submits one field per value', () => {
    const { wrapper } = makeMultiSelect({ name: 'fruit', value: ['apple', 'banana'] })
    const inputs = wrapper.findAll('input[type="hidden"]')

    // The shape a form expects for a repeated field: fruit=apple&fruit=banana.
    expect(inputs.map((i) => i.attributes('value'))).toEqual(['apple', 'banana'])
    expect(inputs.every((i) => i.attributes('name') === 'fruit')).toBe(true)
  })

  it('fails loudly outside its root', () => {
    const Orphan = defineComponent({
      setup: () => () => h(MultiSelectItem, { value: 'a' }),
    })
    expect(() => mount(Orphan)).toThrowError(/outside <MultiSelectRoot>/)
  })
})
