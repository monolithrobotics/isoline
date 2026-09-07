import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h } from 'vue'
import SwitchRoot from '../SwitchRoot.vue'
import SwitchThumb from '../SwitchThumb.vue'

function mountSwitch(props: Record<string, unknown> = {}) {
  return mount(SwitchRoot, {
    props,
    slots: { default: () => h(SwitchThumb) },
  })
}

describe('SwitchRoot', () => {
  // The control renders a sibling hidden input, so Vue will not place
  // fallthrough attributes for us. Dropping `class` on an unstyled primitive
  // renders an invisible control, which is why these are pinned.
  it('forwards consumer attributes onto the button', () => {
    const wrapper = mount(SwitchRoot, {
      props: { modelValue: false },
      attrs: { class: 'my-switch', id: 'notify', 'aria-label': 'Notifications' },
      slots: { default: () => h(SwitchThumb) },
    })
    const button = wrapper.get('button')

    expect(button.classes()).toContain('my-switch')
    // `id` on the button is what lets a sibling `<label for>` name it and
    // forward its clicks — `<button>` is a labelable element.
    expect(button.attributes('id')).toBe('notify')
    expect(button.attributes('aria-label')).toBe('Notifications')
  })

  it('forwards attributes even while the mirrored input is rendered', () => {
    const wrapper = mount(SwitchRoot, {
      props: { modelValue: false, name: 'notifications' },
      attrs: { class: 'my-switch' },
      slots: { default: () => h(SwitchThumb) },
    })

    expect(wrapper.get('button').classes()).toContain('my-switch')
    // The mirror stays hidden and unclassed — it is plumbing, not the control.
    expect(wrapper.get('input').classes()).not.toContain('my-switch')
  })

  it('keeps its own contract when an attribute would contradict it', () => {
    const wrapper = mount(SwitchRoot, {
      props: { modelValue: true },
      attrs: { role: 'checkbox', 'data-state': 'unchecked' },
      slots: { default: () => h(SwitchThumb) },
    })
    const button = wrapper.get('button')

    expect(button.attributes('role')).toBe('switch')
    expect(button.attributes('data-state')).toBe('checked')
  })

  it('announces itself as a switch rather than a checkbox', () => {
    const wrapper = mountSwitch()
    const button = wrapper.get('button')

    expect(button.attributes('role')).toBe('switch')
    expect(button.attributes('type')).toBe('button')
    expect(button.attributes('aria-checked')).toBe('false')
  })

  it('reflects modelValue into aria-checked and data-state', async () => {
    const wrapper = mountSwitch({ modelValue: false })
    expect(wrapper.get('button').attributes('data-state')).toBe('unchecked')

    await wrapper.setProps({ modelValue: true })
    expect(wrapper.get('button').attributes('aria-checked')).toBe('true')
    expect(wrapper.get('button').attributes('data-state')).toBe('checked')
  })

  it('emits the flipped value on click without mutating its own prop', async () => {
    const wrapper = mountSwitch({ modelValue: false })
    await wrapper.get('button').trigger('click')

    expect(wrapper.emitted('update:modelValue')).toEqual([[true]])
    // The parent owns the value: until it writes back, we still render `false`.
    expect(wrapper.get('button').attributes('data-state')).toBe('unchecked')
  })

  it('stays silent and marked when disabled', async () => {
    const wrapper = mountSwitch({ modelValue: false, disabled: true })
    const button = wrapper.get('button')

    expect(button.attributes('disabled')).toBeDefined()
    expect(button.attributes('data-disabled')).toBe('')

    await button.trigger('click')
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
  })

  it('omits data-disabled entirely when enabled', () => {
    // An empty-string attribute is truthy to `[data-disabled]` CSS selectors,
    // so "absent" and "present but empty" must not be confused.
    expect(mountSwitch().get('button').attributes('data-disabled')).toBeUndefined()
  })
})

describe('SwitchRoot form participation', () => {
  it('renders no hidden input when there is no name to submit under', () => {
    expect(mountSwitch().find('input[type="checkbox"]').exists()).toBe(false)
  })

  it('mirrors state into a hidden checkbox when named', async () => {
    const wrapper = mountSwitch({ name: 'notifications', modelValue: true })
    const input = wrapper.get('input[type="checkbox"]')

    expect(input.attributes('name')).toBe('notifications')
    expect(input.attributes('value')).toBe('on')
    expect(input.attributes('aria-hidden')).toBe('true')
    expect(input.attributes('tabindex')).toBe('-1')
    expect((input.element as HTMLInputElement).checked).toBe(true)

    await wrapper.setProps({ modelValue: false })
    expect((input.element as HTMLInputElement).checked).toBe(false)
  })

  it('carries a custom submitted value', () => {
    const wrapper = mountSwitch({ name: 'mode', value: 'service' })
    expect(wrapper.get('input[type="checkbox"]').attributes('value')).toBe('service')
  })
})

describe('SwitchThumb', () => {
  it('mirrors the root state it was given', async () => {
    const wrapper = mountSwitch({ modelValue: true })
    const thumb = wrapper.getComponent(SwitchThumb)

    expect(thumb.get('span').attributes('data-state')).toBe('checked')

    await wrapper.setProps({ modelValue: false })
    expect(thumb.get('span').attributes('data-state')).toBe('unchecked')
  })

  it('fails loudly when rendered outside its root', () => {
    const Orphan = defineComponent({
      components: { SwitchThumb },
      setup: () => () => h(SwitchThumb),
    })

    expect(() => mount(Orphan)).toThrowError(/outside <SwitchRoot>/)
  })
})
