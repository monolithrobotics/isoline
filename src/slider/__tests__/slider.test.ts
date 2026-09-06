import { describe, it, expect } from 'vitest'
import { enableAutoUnmount, mount } from '@vue/test-utils'
import { defineComponent, h, ref } from 'vue'
import SliderRoot from '../SliderRoot.vue'
import SliderRange from '../SliderRange.vue'
import SliderThumb from '../SliderThumb.vue'

enableAutoUnmount(afterEach)

/* eslint-disable vue/one-component-per-file --
   Throwaway host components. Splitting the file to satisfy a rule about real
   components would scatter one behaviour across several files. */
function makeSlider(props: Record<string, unknown> = {}) {
  const value = ref((props.modelValue as number) ?? 0)

  const Host = defineComponent({
    setup: () => () =>
      h(
        SliderRoot,
        {
          ...props,
          modelValue: value.value,
          'onUpdate:modelValue': (next: number) => (value.value = next),
        },
        () => [h(SliderRange), h(SliderThumb)],
      ),
  })

  return { value, wrapper: mount(Host) }
}

const slider = (w: ReturnType<typeof makeSlider>['wrapper']) => w.get('[role="slider"]')

/** jsdom gives every element a zero-sized rect, so the track needs one. */
function withTrack(w: ReturnType<typeof makeSlider>['wrapper']) {
  const el = slider(w).element as HTMLElement
  const rect = {
    left: 0,
    top: 0,
    right: 200,
    bottom: 100,
    width: 200,
    height: 100,
    x: 0,
    y: 0,
  }
  el.getBoundingClientRect = () => rect as DOMRect
  return el
}

/**
 * Dispatches a pointer event with real coordinates.
 *
 * `trigger()` cannot set `clientX` — it assigns onto an already-constructed
 * event, and those properties are getter-only. jsdom has no `PointerEvent`
 * either, and `MouseEvent` carries everything the slider reads.
 */
async function pointer(
  w: ReturnType<typeof makeSlider>['wrapper'],
  type: 'pointerdown' | 'pointermove',
  init: MouseEventInit,
) {
  withTrack(w).dispatchEvent(new MouseEvent(type, { bubbles: true, buttons: 1, ...init }))
  await w.vm.$nextTick()
}

describe('SliderRoot', () => {
  it('is one focusable slider, announcing its value and range', () => {
    const { wrapper } = makeSlider({ modelValue: 30, min: 0, max: 100 })
    const root = slider(wrapper)

    expect(root.attributes('tabindex')).toBe('0')
    expect(root.attributes('aria-valuenow')).toBe('30')
    expect(root.attributes('aria-valuemin')).toBe('0')
    expect(root.attributes('aria-valuemax')).toBe('100')
    expect(root.attributes('aria-orientation')).toBe('horizontal')
  })

  it('publishes the position as a fraction for the consumer to lay out', () => {
    const { wrapper } = makeSlider({ modelValue: 25, min: 0, max: 100 })

    // A number, not a percentage string: the consumer decides whether it means
    // `left`, `height`, a rotation, or something else entirely.
    expect(slider(wrapper).attributes('style')).toContain(
      '--isoline-slider-fraction: 0.25',
    )
  })

  it('anchors at the start rather than dividing by zero on an empty range', () => {
    const { wrapper } = makeSlider({ modelValue: 5, min: 5, max: 5 })
    expect(slider(wrapper).attributes('style')).toContain('--isoline-slider-fraction: 0')
  })

  it('takes itself out of the tab order when disabled', async () => {
    const { value, wrapper } = makeSlider({ modelValue: 30, disabled: true })

    expect(slider(wrapper).attributes('tabindex')).toBe('-1')
    expect(slider(wrapper).attributes('aria-disabled')).toBe('true')

    await slider(wrapper).trigger('keydown', { key: 'ArrowRight' })
    expect(value.value).toBe(30)
  })

  it('announces a custom value text when the raw number would not help', () => {
    const { wrapper } = makeSlider({ modelValue: 40, ariaValueText: '40 percent' })
    expect(slider(wrapper).attributes('aria-valuetext')).toBe('40 percent')
  })
})

describe('Slider keyboard', () => {
  it('steps with the arrows in both axes', async () => {
    const { value, wrapper } = makeSlider({ modelValue: 50, step: 5 })

    await slider(wrapper).trigger('keydown', { key: 'ArrowRight' })
    expect(value.value).toBe(55)

    await slider(wrapper).trigger('keydown', { key: 'ArrowDown' })
    expect(value.value).toBe(50)

    await slider(wrapper).trigger('keydown', { key: 'ArrowUp' })
    expect(value.value).toBe(55)
  })

  it('jumps with page keys and lands on the ends with Home and End', async () => {
    const { value, wrapper } = makeSlider({ modelValue: 50, step: 1, largeStep: 10 })

    await slider(wrapper).trigger('keydown', { key: 'PageUp' })
    expect(value.value).toBe(60)

    await slider(wrapper).trigger('keydown', { key: 'Home' })
    expect(value.value).toBe(0)

    await slider(wrapper).trigger('keydown', { key: 'End' })
    expect(value.value).toBe(100)
  })

  it('stops at the ends', async () => {
    const { value, wrapper } = makeSlider({ modelValue: 100, max: 100 })
    await slider(wrapper).trigger('keydown', { key: 'ArrowRight' })

    expect(value.value).toBe(100)
  })
})

describe('Slider pointer', () => {
  it('jumps to where the track was pressed', async () => {
    const { value, wrapper } = makeSlider({ modelValue: 0, min: 0, max: 100 })
    await pointer(wrapper, 'pointerdown', { clientX: 150, clientY: 50 })
    expect(value.value).toBe(75)
  })

  it('follows a drag only while a button is held', async () => {
    const { value, wrapper } = makeSlider({ modelValue: 0, min: 0, max: 100 })
    await pointer(wrapper, 'pointermove', { clientX: 100, buttons: 0 })
    // A pointer merely passing over the track must not move anything.
    expect(value.value).toBe(0)

    await pointer(wrapper, 'pointermove', { clientX: 100, buttons: 1 })
    expect(value.value).toBe(50)
  })

  it('clamps a press past the end of the track', async () => {
    const { value, wrapper } = makeSlider({ modelValue: 0, min: 0, max: 100 })
    await pointer(wrapper, 'pointerdown', { clientX: 900 })
    expect(value.value).toBe(100)
  })

  it('runs bottom-to-top when vertical', async () => {
    const { value, wrapper } = makeSlider({
      modelValue: 0,
      min: 0,
      max: 100,
      orientation: 'vertical',
    })
    // 25px from the bottom of a 100px track is a quarter of the way up, the
    // way a fader or a level reads — the opposite of the y axis.
    await pointer(wrapper, 'pointerdown', { clientY: 75 })
    expect(value.value).toBe(25)
  })

  it('ignores the pointer when disabled', async () => {
    const { value, wrapper } = makeSlider({ modelValue: 10, disabled: true })
    await pointer(wrapper, 'pointerdown', { clientX: 150 })
    expect(value.value).toBe(10)
  })
})

describe('Slider parts', () => {
  it('gives the range and the thumb the same fraction as the root', () => {
    const { wrapper } = makeSlider({ modelValue: 20, min: 0, max: 100 })

    const fractions = wrapper
      .findAll('[aria-hidden="true"]')
      .map((part) => part.attributes('style'))

    // One source for the position: a range that computed its own could drift
    // out of step with the thumb.
    expect(fractions).toEqual([
      expect.stringContaining('--isoline-slider-fraction: 0.2'),
      expect.stringContaining('--isoline-slider-fraction: 0.2'),
    ])
  })

  it('fails loudly outside its root', () => {
    const Orphan = defineComponent({ setup: () => () => h(SliderThumb) })
    expect(() => mount(Orphan)).toThrowError(/outside <SliderRoot>/)
  })
})
