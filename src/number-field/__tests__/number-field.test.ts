import { describe, it, expect } from 'vitest'
import { enableAutoUnmount, mount } from '@vue/test-utils'
import { defineComponent, h, ref } from 'vue'
import NumberFieldRoot from '../NumberFieldRoot.vue'
import NumberFieldInput from '../NumberFieldInput.vue'
import NumberFieldIncrement from '../NumberFieldIncrement.vue'
import NumberFieldDecrement from '../NumberFieldDecrement.vue'

enableAutoUnmount(afterEach)

/* eslint-disable vue/one-component-per-file --
   Throwaway host components. Splitting the file to satisfy a rule about real
   components would scatter one behaviour across several files. */
function makeField(props: Record<string, unknown> = {}) {
  const value = ref<number | undefined>(props.modelValue as number | undefined)

  const Host = defineComponent({
    setup: () => () =>
      h(
        NumberFieldRoot,
        {
          ...props,
          modelValue: value.value,
          'onUpdate:modelValue': (next: number | undefined) => (value.value = next),
        },
        () => [
          h(NumberFieldDecrement, () => '-'),
          h(NumberFieldInput),
          h(NumberFieldIncrement, () => '+'),
        ],
      ),
  })

  return { value, wrapper: mount(Host) }
}

const input = (w: ReturnType<typeof makeField>['wrapper']) => w.get('input')
const buttons = (w: ReturnType<typeof makeField>['wrapper']) => w.findAll('button')

describe('NumberFieldInput', () => {
  it('is a text input with a numeric keypad, not type=number', () => {
    const { wrapper } = makeField({ modelValue: 3 })
    const field = input(wrapper)

    // `type="number"` discards what it cannot parse, taking the rest of the
    // number with it, and steps on scroll under someone scrolling the page.
    expect(field.attributes('type')).toBe('text')
    expect(field.attributes('inputmode')).toBe('numeric')
    expect(field.attributes('role')).toBe('spinbutton')
  })

  it('announces the value and the range', () => {
    const { wrapper } = makeField({ modelValue: 3, min: 0, max: 10 })
    const field = input(wrapper)

    expect(field.attributes('aria-valuenow')).toBe('3')
    expect(field.attributes('aria-valuemin')).toBe('0')
    expect(field.attributes('aria-valuemax')).toBe('10')
  })

  it('leaves an unbounded field without min and max to announce', () => {
    const { wrapper } = makeField({ modelValue: 3 })

    // Infinity is not a bound anyone can act on, and screen readers read it
    // aloud as a word.
    expect(input(wrapper).attributes('aria-valuemin')).toBeUndefined()
  })

  it('commits on blur, not on every keystroke', async () => {
    const { value, wrapper } = makeField({ modelValue: 1 })
    await input(wrapper).setValue('-')

    // Mid-word "-" is not a number, and clamping it would fight the user.
    expect(value.value).toBe(1)

    await input(wrapper).setValue('-5')
    await input(wrapper).trigger('blur')
    expect(value.value).toBe(-5)
  })

  it('treats an emptied field as undefined, never as zero', async () => {
    const { value, wrapper } = makeField({ modelValue: 7 })
    await input(wrapper).setValue('')
    await input(wrapper).trigger('blur')

    expect(value.value).toBeUndefined()
  })

  it('keeps the text when it cannot be parsed', async () => {
    const { value, wrapper } = makeField({ modelValue: 7 })
    await input(wrapper).setValue('abc')
    await input(wrapper).trigger('blur')

    expect(value.value).toBe(7)
    expect((input(wrapper).element as HTMLInputElement).value).toBe('abc')
  })

  it('steps with the arrows and jumps with page keys', async () => {
    const { value, wrapper } = makeField({ modelValue: 4, step: 2, largeStep: 5 })

    await input(wrapper).trigger('keydown', { key: 'ArrowUp' })
    expect(value.value).toBe(6)

    await input(wrapper).trigger('keydown', { key: 'ArrowDown' })
    expect(value.value).toBe(4)

    await input(wrapper).trigger('keydown', { key: 'PageUp' })
    expect(value.value).toBe(14)
  })

  it('steps an off-grid value onto the grid rather than dragging it along', async () => {
    const { value, wrapper } = makeField({ modelValue: 5, step: 2 })
    await input(wrapper).trigger('keydown', { key: 'ArrowUp' })

    // 5 is not a multiple of 2, so up lands on the next valid value rather
    // than on 7 — otherwise one off-grid value poisons every later one. This
    // is what a native number input does.
    expect(value.value).toBe(6)
  })

  it('follows a value changed from outside', async () => {
    const { value, wrapper } = makeField({ modelValue: 1 })
    value.value = 42
    await wrapper.vm.$nextTick()

    expect((input(wrapper).element as HTMLInputElement).value).toBe('42')
  })
})

describe('NumberField range', () => {
  it('clamps what it commits', async () => {
    const { value, wrapper } = makeField({ modelValue: 5, min: 0, max: 10 })
    await input(wrapper).setValue('99')
    await input(wrapper).trigger('blur')

    expect(value.value).toBe(10)
  })

  it('snaps to the step, measured from min rather than from zero', async () => {
    const { value, wrapper } = makeField({ modelValue: 0.5, min: 0.5, step: 1 })
    await input(wrapper).setValue('2.1')
    await input(wrapper).trigger('blur')

    // Valid values here are 0.5, 1.5, 2.5 — snapping to zero would produce 2,
    // which the range does not contain.
    expect(value.value).toBe(2.5)
  })

  it('does not leak float error into the value', async () => {
    const { value, wrapper } = makeField({ modelValue: 0.1, step: 0.1 })
    await input(wrapper).trigger('keydown', { key: 'ArrowUp' })
    await input(wrapper).trigger('keydown', { key: 'ArrowUp' })

    // Not 0.30000000000000004, which is what the arithmetic actually gives.
    expect(value.value).toBe(0.3)
  })

  it('steps an empty field to the floor of its range', async () => {
    const { value, wrapper } = makeField({ min: 0, max: 10 })
    await input(wrapper).trigger('keydown', { key: 'ArrowUp' })

    // Up on an empty field bounded at 0 gives 0, not one step past it.
    expect(value.value).toBe(0)
  })
})

describe('NumberField steppers', () => {
  it('steps in both directions', async () => {
    const { value, wrapper } = makeField({ modelValue: 5 })

    await buttons(wrapper)[1]!.trigger('click')
    expect(value.value).toBe(6)

    await buttons(wrapper)[0]!.trigger('click')
    expect(value.value).toBe(5)
  })

  it('stays out of the tab order and out of the accessibility tree', () => {
    const { wrapper } = makeField({ modelValue: 5 })

    // The spinbutton already handles Up and Down; two extra tab stops that do
    // nothing new are noise, not access.
    expect(buttons(wrapper).every((b) => b.attributes('tabindex') === '-1')).toBe(true)
    expect(buttons(wrapper).every((b) => b.attributes('aria-hidden') === 'true')).toBe(
      true,
    )
  })

  it('disables the stepper that would do nothing', () => {
    const { wrapper } = makeField({ modelValue: 10, min: 0, max: 10 })

    expect(buttons(wrapper)[1]!.attributes('disabled')).toBeDefined()
    expect(buttons(wrapper)[0]!.attributes('disabled')).toBeUndefined()
  })

  it('stays silent when the whole field is disabled', async () => {
    const { value, wrapper } = makeField({ modelValue: 5, disabled: true })
    await buttons(wrapper)[1]!.trigger('click')

    expect(value.value).toBe(5)
    expect(input(wrapper).attributes('data-disabled')).toBe('')
  })
})

describe('NumberField parts outside their root', () => {
  it('fails loudly', () => {
    const Orphan = defineComponent({ setup: () => () => h(NumberFieldInput) })
    expect(() => mount(Orphan)).toThrowError(/outside <NumberFieldRoot>/)
  })
})
