import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import Toggle from '../Toggle.vue'

describe('Toggle', () => {
  it('is a pressed button, not a switch or a checkbox', () => {
    const button = mount(Toggle, { props: { modelValue: true } }).get('button')

    // A toggle button's effect persists; a switch commits a setting. Saying
    // the wrong one tells a screen reader user the wrong thing about pressing.
    expect(button.attributes('aria-pressed')).toBe('true')
    expect(button.attributes('role')).toBeUndefined()
    expect(button.attributes('type')).toBe('button')
  })

  it('reflects state into data-state', async () => {
    const wrapper = mount(Toggle, { props: { modelValue: false } })
    expect(wrapper.get('button').attributes('data-state')).toBe('off')

    await wrapper.setProps({ modelValue: true })
    expect(wrapper.get('button').attributes('data-state')).toBe('on')
  })

  it('emits the flipped value without mutating its own prop', async () => {
    const wrapper = mount(Toggle, { props: { modelValue: false } })
    await wrapper.get('button').trigger('click')

    expect(wrapper.emitted('update:modelValue')).toEqual([[true]])
    expect(wrapper.get('button').attributes('data-state')).toBe('off')
  })

  it('stays silent when disabled', async () => {
    const wrapper = mount(Toggle, { props: { modelValue: false, disabled: true } })
    await wrapper.get('button').trigger('click')

    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    expect(wrapper.get('button').attributes('data-disabled')).toBe('')
  })
})
