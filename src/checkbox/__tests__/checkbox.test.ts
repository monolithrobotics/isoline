import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h } from 'vue'
import CheckboxRoot from '../CheckboxRoot.vue'
import CheckboxIndicator from '../CheckboxIndicator.vue'

function mountCheckbox(props: Record<string, unknown> = {}) {
  return mount(CheckboxRoot, {
    props,
    slots: { default: () => h(CheckboxIndicator) },
  })
}

describe('CheckboxRoot', () => {
  // Same multi-root problem as SwitchRoot: without explicit forwarding Vue
  // drops `class`, and an unstyled primitive with no class is invisible.
  it('forwards consumer attributes onto the button', () => {
    const wrapper = mount(CheckboxRoot, {
      attrs: { class: 'my-checkbox', id: 'terms', 'aria-label': 'Accept terms' },
      slots: { default: () => h(CheckboxIndicator) },
    })
    const button = wrapper.get('button')

    expect(button.classes()).toContain('my-checkbox')
    expect(button.attributes('id')).toBe('terms')
    expect(button.attributes('aria-label')).toBe('Accept terms')
  })

  it('keeps its own contract when an attribute would contradict it', () => {
    const wrapper = mount(CheckboxRoot, {
      props: { modelValue: true },
      attrs: { role: 'switch' },
      slots: { default: () => h(CheckboxIndicator) },
    })

    expect(wrapper.get('button').attributes('role')).toBe('checkbox')
  })

  it('announces itself as a checkbox', () => {
    const button = mountCheckbox().get('button')

    expect(button.attributes('role')).toBe('checkbox')
    expect(button.attributes('type')).toBe('button')
    expect(button.attributes('aria-checked')).toBe('false')
  })

  it('reflects each of the three states', async () => {
    const wrapper = mountCheckbox({ modelValue: false })
    expect(wrapper.get('button').attributes('data-state')).toBe('unchecked')

    await wrapper.setProps({ modelValue: true })
    expect(wrapper.get('button').attributes('aria-checked')).toBe('true')
    expect(wrapper.get('button').attributes('data-state')).toBe('checked')

    await wrapper.setProps({ modelValue: 'indeterminate' })
    // `mixed`, not `true` — the difference is the whole point of the state.
    expect(wrapper.get('button').attributes('aria-checked')).toBe('mixed')
    expect(wrapper.get('button').attributes('data-state')).toBe('indeterminate')
  })

  it('emits the flipped value on click without mutating its own prop', async () => {
    const wrapper = mountCheckbox({ modelValue: false })
    await wrapper.get('button').trigger('click')

    expect(wrapper.emitted('update:modelValue')).toEqual([[true]])
    expect(wrapper.get('button').attributes('data-state')).toBe('unchecked')
  })

  it('resolves indeterminate to checked, never to unchecked', async () => {
    const wrapper = mountCheckbox({ modelValue: 'indeterminate' })
    await wrapper.get('button').trigger('click')

    expect(wrapper.emitted('update:modelValue')).toEqual([[true]])
  })

  it('stays silent and marked when disabled', async () => {
    const wrapper = mountCheckbox({ modelValue: false, disabled: true })
    const button = wrapper.get('button')

    expect(button.attributes('disabled')).toBeDefined()
    expect(button.attributes('data-disabled')).toBe('')

    await button.trigger('click')
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
  })

  it('omits data-disabled entirely when enabled', () => {
    expect(mountCheckbox().get('button').attributes('data-disabled')).toBeUndefined()
  })
})

describe('CheckboxRoot form participation', () => {
  it('renders no hidden input when there is no name to submit under', () => {
    expect(mountCheckbox().find('input[type="checkbox"]').exists()).toBe(false)
  })

  it('mirrors state into a hidden checkbox when named', async () => {
    const wrapper = mountCheckbox({ name: 'terms', modelValue: true })
    const input = wrapper.get('input[type="checkbox"]')

    expect(input.attributes('name')).toBe('terms')
    expect(input.attributes('aria-hidden')).toBe('true')
    expect((input.element as HTMLInputElement).checked).toBe(true)

    await wrapper.setProps({ modelValue: false })
    expect((input.element as HTMLInputElement).checked).toBe(false)
  })

  it('submits nothing while indeterminate, as a native checkbox would', () => {
    const wrapper = mountCheckbox({ name: 'terms', modelValue: 'indeterminate' })
    expect(
      (wrapper.get('input[type="checkbox"]').element as HTMLInputElement).checked,
    ).toBe(false)
  })
})

describe('CheckboxIndicator', () => {
  it('stays out of the DOM while unchecked', () => {
    expect(
      mountCheckbox({ modelValue: false })
        .findComponent(CheckboxIndicator)
        .find('span')
        .exists(),
    ).toBe(false)
  })

  it('renders for both checked and indeterminate', async () => {
    const wrapper = mountCheckbox({ modelValue: true })
    expect(wrapper.get('span').attributes('data-state')).toBe('checked')

    await wrapper.setProps({ modelValue: 'indeterminate' })
    expect(wrapper.get('span').attributes('data-state')).toBe('indeterminate')
  })

  it('stays mounted in every state when force-mounted, for transitions', () => {
    const wrapper = mount(CheckboxRoot, {
      props: { modelValue: false },
      slots: { default: () => h(CheckboxIndicator, { forceMount: true }) },
    })

    expect(wrapper.get('span').attributes('data-state')).toBe('unchecked')
  })

  it('fails loudly when rendered outside its root', () => {
    const Orphan = defineComponent({ setup: () => () => h(CheckboxIndicator) })

    expect(() => mount(Orphan)).toThrowError(/outside <CheckboxRoot>/)
  })
})
