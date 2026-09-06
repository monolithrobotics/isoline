import { describe, it, expect } from 'vitest'
import { enableAutoUnmount, mount } from '@vue/test-utils'
import { defineComponent, h, nextTick, ref } from 'vue'
import SplitterRoot from '../SplitterRoot.vue'
import SplitterPanel from '../SplitterPanel.vue'
import SplitterHandle from '../SplitterHandle.vue'

enableAutoUnmount(afterEach)

/* eslint-disable vue/one-component-per-file --
   Throwaway host components. Splitting the file to satisfy a rule about real
   components would scatter one behaviour across several files. */
function makeSplitter(
  init: {
    sizes?: number[]
    orientation?: 'horizontal' | 'vertical'
    disabled?: boolean
    mins?: number[]
    panels?: number
  } = {},
) {
  const sizes = ref<number[] | undefined>(init.sizes)
  const count = init.panels ?? 2
  const mins = init.mins ?? []

  const Host = defineComponent({
    setup: () => () =>
      h(
        SplitterRoot,
        {
          sizes: sizes.value,
          orientation: init.orientation,
          disabled: init.disabled,
          'onUpdate:sizes': (next: number[]) => (sizes.value = next),
        },
        () =>
          Array.from({ length: count }, (_, i) => [
            h(SplitterPanel, { key: `p${i}`, minSize: mins[i] ?? 0 }, () => `panel ${i}`),
            i < count - 1 ? h(SplitterHandle, { key: `h${i}` }) : null,
          ]).flat(),
      ),
  })

  return { sizes, wrapper: mount(Host, { attachTo: document.body }) }
}

type Wrapper = ReturnType<typeof makeSplitter>['wrapper']
const handles = (w: Wrapper) => w.findAll('[role="separator"]')
const panels = (w: Wrapper) => w.findAll('[data-isoline-panel]')

/** jsdom lays nothing out, so the container needs a length along the axis. */
function withContainer(w: Wrapper, length = 1000) {
  const container = handles(w)[0]!.element.parentElement as HTMLElement
  Object.defineProperty(container, 'offsetWidth', { value: length, configurable: true })
  Object.defineProperty(container, 'offsetHeight', { value: length, configurable: true })
}

async function drag(w: Wrapper, index: number, px: number, axis: 'x' | 'y' = 'x') {
  withContainer(w)
  const handle = handles(w)[index]!.element
  handle.dispatchEvent(
    new MouseEvent('pointermove', {
      bubbles: true,
      buttons: 1,
      ...(axis === 'x' ? { movementX: px } : { movementY: px }),
    }),
  )
  await nextTick()
}

describe('SplitterRoot', () => {
  it('splits evenly before anyone has dragged it', async () => {
    const { wrapper } = makeSplitter()
    await nextTick()

    // A splitter has to work without the consumer computing an initial array.
    expect(panels(wrapper).map((p) => p.attributes('style'))).toEqual([
      expect.stringContaining('--isoline-splitter-size: 50%'),
      expect.stringContaining('--isoline-splitter-size: 50%'),
    ])
  })

  it('publishes each share as a custom property rather than imposing layout', async () => {
    const { wrapper } = makeSplitter({ sizes: [70, 30] })
    await nextTick()

    // The consumer decides whether that means a flex basis, a grid track or a
    // width — the root sets no display of its own.
    expect(panels(wrapper)[0]!.attributes('style')).toContain(
      '--isoline-splitter-size: 70%',
    )
    expect(wrapper.get('[data-orientation]').attributes('style')).toBeUndefined()
  })
})

describe('SplitterHandle', () => {
  it('is a focusable separator that reports the boundary it holds', async () => {
    const { wrapper } = makeSplitter({ sizes: [70, 30] })
    await nextTick()
    const handle = handles(wrapper)[0]!

    expect(handle.attributes('tabindex')).toBe('0')
    expect(handle.attributes('aria-valuenow')).toBe('70')
    expect(handle.attributes('aria-orientation')).toBe('horizontal')
  })

  it('reports limits that account for both minimums', async () => {
    const { wrapper } = makeSplitter({ sizes: [70, 30], mins: [20, 25] })
    await nextTick()
    const handle = handles(wrapper)[0]!

    expect(handle.attributes('aria-valuemin')).toBe('20')
    expect(handle.attributes('aria-valuemax')).toBe('75')
  })
})

describe('Splitter keyboard', () => {
  it('resizes with the arrows along its own axis', async () => {
    const { sizes, wrapper } = makeSplitter({ sizes: [50, 50] })
    await nextTick()

    await handles(wrapper)[0]!.trigger('keydown', { key: 'ArrowRight' })
    expect(sizes.value).toEqual([51, 49])

    await handles(wrapper)[0]!.trigger('keydown', { key: 'ArrowLeft' })
    expect(sizes.value).toEqual([50, 50])
  })

  it('uses the vertical arrows when stacked', async () => {
    const { sizes, wrapper } = makeSplitter({ sizes: [50, 50], orientation: 'vertical' })
    await nextTick()

    await handles(wrapper)[0]!.trigger('keydown', { key: 'ArrowRight' })
    expect(sizes.value).toEqual([50, 50])

    await handles(wrapper)[0]!.trigger('keydown', { key: 'ArrowDown' })
    expect(sizes.value).toEqual([51, 49])
  })

  it('jumps with the page keys and collapses to the limits with Home and End', async () => {
    const { sizes, wrapper } = makeSplitter({ sizes: [50, 50], mins: [10, 20] })
    await nextTick()

    await handles(wrapper)[0]!.trigger('keydown', { key: 'PageDown' })
    expect(sizes.value).toEqual([60, 40])

    await handles(wrapper)[0]!.trigger('keydown', { key: 'Home' })
    expect(sizes.value).toEqual([10, 90])

    await handles(wrapper)[0]!.trigger('keydown', { key: 'End' })
    expect(sizes.value).toEqual([80, 20])
  })

  it('stops at a minimum instead of pushing the other pane below its own', async () => {
    const { sizes, wrapper } = makeSplitter({ sizes: [50, 50], mins: [0, 45] })
    await nextTick()

    await handles(wrapper)[0]!.trigger('keydown', { key: 'PageDown' })
    // A drag past one floor must not take the other pane under its minimum.
    expect(sizes.value).toEqual([55, 45])

    await handles(wrapper)[0]!.trigger('keydown', { key: 'PageDown' })
    expect(sizes.value).toEqual([55, 45])
  })
})

describe('Splitter pointer', () => {
  it('resizes by the fraction of the container the pointer moved', async () => {
    const { sizes, wrapper } = makeSplitter({ sizes: [50, 50] })
    await nextTick()

    // 100px of a 1000px container is ten percent.
    await drag(wrapper, 0, 100)
    expect(sizes.value).toEqual([60, 40])
  })

  it('ignores a pointer that is merely passing over', async () => {
    const { sizes, wrapper } = makeSplitter({ sizes: [50, 50] })
    await nextTick()
    withContainer(wrapper)

    handles(wrapper)[0]!.element.dispatchEvent(
      new MouseEvent('pointermove', { bubbles: true, buttons: 0, movementX: 100 }),
    )
    await nextTick()

    expect(sizes.value).toEqual([50, 50])
  })

  it('stays put when disabled', async () => {
    const { sizes, wrapper } = makeSplitter({ sizes: [50, 50], disabled: true })
    await nextTick()

    await drag(wrapper, 0, 100)
    await handles(wrapper)[0]!.trigger('keydown', { key: 'ArrowRight' })

    expect(sizes.value).toEqual([50, 50])
    expect(handles(wrapper)[0]!.attributes('tabindex')).toBe('-1')
  })
})

describe('Splitter with more than two panes', () => {
  it('moves only the two panes the handle divides', async () => {
    const { sizes, wrapper } = makeSplitter({ sizes: [40, 30, 30], panels: 3 })
    await nextTick()

    await handles(wrapper)[1]!.trigger('keydown', { key: 'PageDown' })

    // Dragging one divider must not shuffle the panes beyond it.
    expect(sizes.value).toEqual([40, 40, 20])
  })

  it('fails loudly outside its root', () => {
    const Orphan = defineComponent({ setup: () => () => h(SplitterHandle) })
    expect(() => mount(Orphan)).toThrowError(/outside <SplitterRoot>/)
  })
})
