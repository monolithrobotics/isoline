import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { enableAutoUnmount, mount } from '@vue/test-utils'
import { defineComponent, h, nextTick, ref } from 'vue'
import TooltipRoot from '../TooltipRoot.vue'
import TooltipTrigger from '../TooltipTrigger.vue'
import Portal from '../../portal/Portal.vue'
import TooltipContent from '../TooltipContent.vue'

enableAutoUnmount(afterEach)

beforeEach(() => vi.useFakeTimers())
afterEach(() => vi.useRealTimers())

/* eslint-disable vue/one-component-per-file --
   Throwaway host components. Splitting the file to satisfy a rule about real
   components would scatter one behaviour across several files. */
function makeTooltip(props: Record<string, unknown> = {}) {
  const open = ref((props.open as boolean) ?? false)

  const Host = defineComponent({
    setup: () => () =>
      h(
        TooltipRoot,
        {
          ...props,
          open: open.value,
          'onUpdate:open': (next: boolean) => (open.value = next),
        },
        () => [
          h(TooltipTrigger, () => h('button', 'Arm')),
          h(Portal, { disabled: true }, () => h(TooltipContent, () => 'Hold to arm')),
        ],
      ),
  })

  return { open, wrapper: mount(Host, { attachTo: document.body }) }
}

const trigger = (w: ReturnType<typeof makeTooltip>['wrapper']) => w.get('span')

describe('TooltipTrigger', () => {
  it('adds no layout of its own', () => {
    const { wrapper } = makeTooltip()

    // `display: contents` so wrapping a flex or grid child does not move it.
    expect(trigger(wrapper).attributes('style')).toContain('display: contents')
    expect(wrapper.get('button').text()).toBe('Arm')
  })

  it('describes its trigger only while showing', async () => {
    const { wrapper } = makeTooltip()
    expect(trigger(wrapper).attributes('aria-describedby')).toBeUndefined()

    await trigger(wrapper).trigger('pointerenter')
    vi.advanceTimersByTime(700)
    await nextTick()

    expect(trigger(wrapper).attributes('aria-describedby')).toBe(
      wrapper.get('[role="tooltip"]').attributes('id'),
    )
  })
})

describe('Tooltip hover', () => {
  it('waits out the delay before opening', async () => {
    const { open, wrapper } = makeTooltip({ delay: 700 })

    await trigger(wrapper).trigger('pointerenter')
    vi.advanceTimersByTime(699)
    // A pointer crossing a toolbar passes over a dozen triggers; opening on
    // arrival would flash a tooltip for each.
    expect(open.value).toBe(false)

    vi.advanceTimersByTime(1)
    expect(open.value).toBe(true)
  })

  it('cancels the pending open when the pointer leaves first', async () => {
    const { open, wrapper } = makeTooltip({ delay: 700 })

    await trigger(wrapper).trigger('pointerenter')
    vi.advanceTimersByTime(400)
    await trigger(wrapper).trigger('pointerleave')
    vi.advanceTimersByTime(1000)

    expect(open.value).toBe(false)
  })

  it('closes on a press, so it does not cover what was just clicked', async () => {
    const { open, wrapper } = makeTooltip({ open: true })
    await trigger(wrapper).trigger('pointerdown')

    expect(open.value).toBe(false)
  })

  it('stays shut when disabled', async () => {
    const { open, wrapper } = makeTooltip({ disabled: true })
    await trigger(wrapper).trigger('pointerenter')
    vi.advanceTimersByTime(5000)

    expect(open.value).toBe(false)
  })
})

describe('Tooltip focus', () => {
  it('opens immediately for a keyboard user, without the hover delay', async () => {
    const { open, wrapper } = makeTooltip()
    const button = wrapper.get('button').element as HTMLButtonElement
    // jsdom has no focus-visible heuristic, so state the condition the trigger
    // actually checks.
    button.matches = ((selector: string) =>
      selector === ':focus-visible') as typeof button.matches

    // Dispatched from the button so the event's target is the button, which
    // is what the trigger tests; `trigger()` cannot set a target.
    button.dispatchEvent(new FocusEvent('focusin', { bubbles: true }))
    await nextTick()

    // Someone who tabbed here has already committed; making them wait is a
    // delay with nothing to prevent.
    expect(open.value).toBe(true)
  })

  it('ignores focus that did not come from the keyboard', async () => {
    const { open, wrapper } = makeTooltip()
    const button = wrapper.get('button').element as HTMLButtonElement
    button.matches = (() => false) as typeof button.matches

    button.dispatchEvent(new FocusEvent('focusin', { bubbles: true }))
    await nextTick()

    // Clicking a button focuses it; a tooltip left hanging over what was just
    // pressed is in the way.
    expect(open.value).toBe(false)
  })

  it('closes when focus leaves', async () => {
    const { open, wrapper } = makeTooltip({ open: true })
    await trigger(wrapper).trigger('focusout')

    expect(open.value).toBe(false)
  })
})

describe('TooltipContent', () => {
  it('is a tooltip, not a dialog', async () => {
    const { wrapper } = makeTooltip({ open: true })
    await nextTick()

    const content = wrapper.get('[role="tooltip"]')
    expect(content.attributes('data-side')).toBeDefined()
    // No tabindex and no aria-modal: it holds nothing to reach.
    expect(content.attributes('tabindex')).toBeUndefined()
  })

  it('closes on Escape, which WCAG requires of hover content', async () => {
    const { open, wrapper } = makeTooltip({ open: true })
    await nextTick()
    expect(wrapper.find('[role="tooltip"]').exists()).toBe(true)

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    expect(open.value).toBe(false)
  })

  it('fails loudly outside its root', () => {
    const Orphan = defineComponent({ setup: () => () => h(TooltipContent) })
    expect(() => mount(Orphan)).toThrowError(/outside <TooltipRoot>/)
  })
})
