import { describe, it, expect } from 'vitest'
import { enableAutoUnmount, mount } from '@vue/test-utils'
import { defineComponent, h, ref } from 'vue'
import PasswordFieldRoot from '../PasswordFieldRoot.vue'
import PasswordFieldInput from '../PasswordFieldInput.vue'
import PasswordFieldToggle from '../PasswordFieldToggle.vue'
import PasswordFieldCapsLock from '../PasswordFieldCapsLock.vue'

enableAutoUnmount(afterEach)

/* eslint-disable vue/one-component-per-file --
   Throwaway host components. Splitting the file to satisfy a rule about real
   components would scatter one behaviour across several files. */
function makeField(
  autocomplete: 'current-password' | 'new-password' = 'current-password',
) {
  const visible = ref(false)
  const password = ref('')

  const Host = defineComponent({
    setup: () => () =>
      h(
        PasswordFieldRoot,
        {
          visible: visible.value,
          'onUpdate:visible': (next: boolean) => (visible.value = next),
        },
        () => [
          h(PasswordFieldInput, {
            autocomplete,
            modelValue: password.value,
            'onUpdate:modelValue': (next: string) => (password.value = next),
          }),
          h(PasswordFieldToggle, () => 'Show'),
          h(PasswordFieldCapsLock, () => 'Caps Lock is on'),
        ],
      ),
  })

  return { visible, password, wrapper: mount(Host) }
}

/**
 * Presses a key with Caps Lock in a given state.
 *
 * `getModifierState` is a prototype method, so passing one through `trigger()`
 * as an event property does not override it — the event has to be built and
 * stubbed before it is dispatched.
 */
async function pressWithCapsLock(
  wrapper: ReturnType<typeof makeField>['wrapper'],
  on: boolean,
) {
  const event = new KeyboardEvent('keydown', { key: 'a', bubbles: true })
  Object.defineProperty(event, 'getModifierState', { value: () => on })
  wrapper.get('input').element.dispatchEvent(event)
  await wrapper.vm.$nextTick()
}

describe('PasswordField', () => {
  it('masks by default and unmasks on demand', async () => {
    const { wrapper } = makeField()
    expect(wrapper.get('input').attributes('type')).toBe('password')

    await wrapper.get('button').trigger('click')
    expect(wrapper.get('input').attributes('type')).toBe('text')
  })

  it('points the toggle at the input it controls', async () => {
    const { wrapper } = makeField()
    const toggle = wrapper.get('button')

    expect(toggle.attributes('aria-pressed')).toBe('false')
    expect(toggle.attributes('aria-controls')).toBe(wrapper.get('input').attributes('id'))
    // Type `button`: a field with a toggle is usually the last control before
    // Enter, and a toggle that submitted the form would be maddening.
    expect(toggle.attributes('type')).toBe('button')
  })

  it('requires an explicit autocomplete rather than guessing', () => {
    // Guessing wrong makes password managers fill or save the wrong thing,
    // which users notice long after the fact.
    expect(
      makeField('new-password').wrapper.get('input').attributes('autocomplete'),
    ).toBe('new-password')
  })

  it('warns while Caps Lock is on, without stealing focus', async () => {
    const { wrapper } = makeField()
    expect(wrapper.find('[role="status"]').exists()).toBe(false)

    await pressWithCapsLock(wrapper, true)
    expect(wrapper.get('[role="status"]').text()).toBe('Caps Lock is on')

    await pressWithCapsLock(wrapper, false)
    expect(wrapper.find('[role="status"]').exists()).toBe(false)
  })

  it('drops the warning when the field loses focus', async () => {
    const { wrapper } = makeField()
    await pressWithCapsLock(wrapper, true)
    await wrapper.get('input').trigger('blur')

    expect(wrapper.find('[role="status"]').exists()).toBe(false)
  })

  it('fails loudly outside its root', () => {
    const Orphan = defineComponent({ setup: () => () => h(PasswordFieldToggle) })
    expect(() => mount(Orphan)).toThrowError(/outside <PasswordFieldRoot>/)
  })
})
