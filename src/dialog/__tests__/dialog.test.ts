import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { enableAutoUnmount, mount } from '@vue/test-utils'
import { defineComponent, h, nextTick, ref } from 'vue'
import DialogRoot from '../DialogRoot.vue'
import DialogTrigger from '../DialogTrigger.vue'
import DialogPortal from '../DialogPortal.vue'
import DialogOverlay from '../DialogOverlay.vue'
import DialogContent from '../DialogContent.vue'
import DialogTitle from '../DialogTitle.vue'
import DialogDescription from '../DialogDescription.vue'
import DialogClose from '../DialogClose.vue'

/**
 * A dialog wired the way a consumer would wire one, with `open` owned by the
 * parent. Teleport is disabled so the panel stays inside the wrapper and the
 * test asserts against the same tree it mounted.
 */
/* eslint-disable vue/one-component-per-file --
   Throwaway host components, one per wiring under test. Splitting the file to
   satisfy a rule about real components would scatter one behaviour across
   several files. */
function makeDialog(options: { content?: () => unknown; modal?: boolean } = {}) {
  const open = ref(false)

  const Host = defineComponent({
    setup() {
      return () =>
        h(
          DialogRoot,
          {
            open: open.value,
            modal: options.modal ?? true,
            'onUpdate:open': (next: boolean) => (open.value = next),
          },
          () => [
            h(DialogTrigger, () => 'Open'),
            h(DialogPortal, { disabled: true }, () => [
              h(DialogOverlay),
              h(
                DialogContent,
                {},
                options.content ??
                  (() => [h(DialogTitle, () => 'Title'), h(DialogClose, () => 'Cancel')]),
              ),
            ]),
          ],
        )
    },
  })

  return { open, wrapper: mount(Host, { attachTo: document.body }) }
}

// Dialogs register themselves in module state — the open-dialog stack and the
// scroll-lock depth — so a wrapper left mounted leaks into the next test and
// makes it assert against someone else's dialog.
enableAutoUnmount(afterEach)

let warn: ReturnType<typeof vi.spyOn>

beforeEach(() => {
  warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
})

afterEach(() => {
  warn.mockRestore()
  document.body.style.overflow = ''
})

describe('DialogRoot', () => {
  it('renders no element of its own', () => {
    const { wrapper } = makeDialog()
    // The trigger sits directly where the root was placed. A container that
    // wrapped its children in a div would break any layout putting the trigger
    // in a grid or a flex row.
    expect(wrapper.element.children[0]?.tagName.toLowerCase()).toBe('button')
  })

  it('keeps the panel out of the DOM while closed', () => {
    const { wrapper } = makeDialog()
    expect(wrapper.find('[role="dialog"]').exists()).toBe(false)
  })

  it('opens from the trigger and closes from a close button', async () => {
    const { open, wrapper } = makeDialog()

    await wrapper.get('button').trigger('click')
    expect(open.value).toBe(true)
    expect(wrapper.find('[role="dialog"]').exists()).toBe(true)

    await wrapper.get('[role="dialog"] button').trigger('click')
    expect(open.value).toBe(false)
    expect(wrapper.find('[role="dialog"]').exists()).toBe(false)
  })
})

describe('DialogTrigger', () => {
  it('describes the relationship it has with the panel', async () => {
    const { wrapper } = makeDialog()
    const trigger = wrapper.get('button')

    expect(trigger.attributes('aria-haspopup')).toBe('dialog')
    expect(trigger.attributes('aria-expanded')).toBe('false')
    // Nothing to control while the panel is unrendered: pointing at an absent
    // id is a dangling reference every a11y checker flags.
    expect(trigger.attributes('aria-controls')).toBeUndefined()

    await trigger.trigger('click')
    expect(trigger.attributes('aria-expanded')).toBe('true')
    expect(trigger.attributes('aria-controls')).toBe(
      wrapper.get('[role="dialog"]').attributes('id'),
    )
  })
})

describe('DialogContent accessible name', () => {
  it('points aria-labelledby at a rendered title', async () => {
    const { wrapper } = makeDialog()
    await wrapper.get('button').trigger('click')

    const panel = wrapper.get('[role="dialog"]')
    expect(panel.attributes('aria-modal')).toBe('true')
    expect(panel.attributes('aria-labelledby')).toBe(wrapper.get('h2').attributes('id'))
    expect(panel.attributes('aria-describedby')).toBeUndefined()
  })

  it('picks up a description when one is rendered', async () => {
    const { wrapper } = makeDialog({
      content: () => [h(DialogTitle, () => 'T'), h(DialogDescription, () => 'D')],
    })
    await wrapper.get('button').trigger('click')

    expect(wrapper.get('[role="dialog"]').attributes('aria-describedby')).toBe(
      wrapper.get('p').attributes('id'),
    )
  })

  it('warns when the panel would be announced as just "dialog"', async () => {
    const { wrapper } = makeDialog({ content: () => [h('p', 'no title here')] })
    await wrapper.get('button').trigger('click')
    await nextTick()

    expect(warn).toHaveBeenCalledWith(expect.stringContaining('no accessible name'))
  })
})

describe('Dialog focus', () => {
  it('moves focus into the panel on open', async () => {
    const { wrapper } = makeDialog()
    await wrapper.get('button').trigger('click')
    await nextTick()

    expect(document.activeElement).toBe(wrapper.get('[role="dialog"] button').element)
  })

  it('falls back to the panel when it holds nothing focusable', async () => {
    const { wrapper } = makeDialog({ content: () => [h(DialogTitle, () => 'T')] })
    await wrapper.get('button').trigger('click')
    await nextTick()

    // Focus has to land somewhere inside, or the screen reader carries on
    // reading the page behind the dialog.
    expect(document.activeElement).toBe(wrapper.get('[role="dialog"]').element)
  })

  it('gives focus back to whatever had it before', async () => {
    const { wrapper } = makeDialog()
    const trigger = wrapper.get('button')

    // A real click focuses the button it lands on; a dispatched one in jsdom
    // does not, so focus it the way the browser would before opening.
    ;(trigger.element as HTMLButtonElement).focus()
    await trigger.trigger('click')
    await nextTick()
    await wrapper.get('[role="dialog"] button').trigger('click')
    await nextTick()

    expect(document.activeElement).toBe(trigger.element)
  })
})

describe('Dialog focus trap', () => {
  function content() {
    return [
      h(DialogTitle, () => 'T'),
      h('button', { id: 'first' }, 'first'),
      h('button', { id: 'last' }, 'last'),
    ]
  }

  it('wraps Tab from the last control back to the first', async () => {
    const { wrapper } = makeDialog({ content })
    await wrapper.get('button').trigger('click')
    await nextTick()

    const last = document.getElementById('last') as HTMLButtonElement
    last.focus()
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', cancelable: true }))

    expect(document.activeElement?.id).toBe('first')
  })

  it('wraps Shift+Tab from the first control back to the last', async () => {
    const { wrapper } = makeDialog({ content })
    await wrapper.get('button').trigger('click')
    await nextTick()

    const first = document.getElementById('first') as HTMLButtonElement
    first.focus()
    document.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true, cancelable: true }),
    )

    expect(document.activeElement?.id).toBe('last')
  })

  it('leaves Tab alone in a non-modal dialog', async () => {
    const { wrapper } = makeDialog({ content, modal: false })
    await wrapper.get('button').trigger('click')
    await nextTick()

    const last = document.getElementById('last') as HTMLButtonElement
    last.focus()
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', cancelable: true }))

    // Non-modal means the page behind stays reachable, so Tab must be allowed
    // to walk right out of the panel.
    expect(document.activeElement?.id).toBe('last')
  })
})

describe('Dialog Escape', () => {
  it('closes on Escape', async () => {
    const { open, wrapper } = makeDialog()
    await wrapper.get('button').trigger('click')
    await nextTick()

    document.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', cancelable: true }),
    )
    expect(open.value).toBe(false)
  })

  it('ignores Escape when told to', async () => {
    const open = ref(true)
    const Host = defineComponent({
      setup: () => () =>
        h(
          DialogRoot,
          { open: open.value, 'onUpdate:open': (next: boolean) => (open.value = next) },
          () =>
            h(DialogPortal, { disabled: true }, () =>
              h(DialogContent, { closeOnEscape: false }, () => h(DialogTitle, () => 'T')),
            ),
        ),
    })
    mount(Host, { attachTo: document.body })
    await nextTick()

    document.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', cancelable: true }),
    )
    expect(open.value).toBe(true)
  })
})

describe('DialogOverlay', () => {
  it('closes on a press that starts on the backdrop', async () => {
    const { open, wrapper } = makeDialog()
    await wrapper.get('button').trigger('click')

    await wrapper.get('[aria-hidden="true"]').trigger('pointerdown')
    expect(open.value).toBe(false)
  })

  it('stays put when told the dialog must be answered', async () => {
    const open = ref(true)
    const Host = defineComponent({
      setup: () => () =>
        h(
          DialogRoot,
          { open: open.value, 'onUpdate:open': (next: boolean) => (open.value = next) },
          () =>
            h(DialogPortal, { disabled: true }, () => [
              h(DialogOverlay, { closeOnClick: false }),
              h(DialogContent, () => h(DialogTitle, () => 'T')),
            ]),
        ),
    })
    const wrapper = mount(Host, { attachTo: document.body })

    await wrapper.get('[aria-hidden="true"]').trigger('pointerdown')
    expect(open.value).toBe(true)
  })
})

describe('Dialog scroll lock', () => {
  it('locks the page while modal and restores what was there before', async () => {
    document.body.style.overflow = 'auto'
    const { wrapper } = makeDialog()

    await wrapper.get('button').trigger('click')
    expect(document.body.style.overflow).toBe('hidden')

    await wrapper.get('[role="dialog"] button').trigger('click')
    // The author's own value, not an empty string we invented.
    expect(document.body.style.overflow).toBe('auto')
  })

  it('leaves the page scrollable for a non-modal dialog', async () => {
    const { wrapper } = makeDialog({ modal: false })
    await wrapper.get('button').trigger('click')

    expect(document.body.style.overflow).not.toBe('hidden')
  })
})

describe('Dialog parts outside their root', () => {
  it('fails loudly', () => {
    const Orphan = defineComponent({ setup: () => () => h(DialogClose) })

    expect(() => mount(Orphan)).toThrowError(/outside <DialogRoot>/)
  })
})
