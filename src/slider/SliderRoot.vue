<script setup lang="ts">
/**
 * A single-value slider, dragged with the pointer or stepped with the keyboard.
 *
 * The track is the root and the thumb is a child, so the consumer positions the
 * thumb from `--isoline-slider-fraction` — a number between 0 and 1 — rather
 * than the library guessing at their layout:
 *
 * ```css
 * .thumb { left: calc(var(--isoline-slider-fraction) * 100%); }
 * ```
 */
import { computed, ref } from 'vue'
import { provideSliderContext } from './context'
import { snap, stepFrom } from '../shared/number'

const props = withDefaults(
  defineProps<{
    /** The current value. Use with `v-model`. */
    modelValue?: number
    /** Smallest value, at the start of the track. */
    min?: number
    /** Largest value, at the end of the track. */
    max?: number
    /** Granularity of dragging and of the arrow keys. */
    step?: number
    /** Multiplier applied by Page Up and Page Down. */
    largeStep?: number
    /** Rejects interaction, and greys out for a11y tools. */
    disabled?: boolean
    /** Which way the track runs. Vertical sliders count upward from the bottom. */
    orientation?: 'horizontal' | 'vertical'
    /** Announced instead of the raw number, e.g. "40 percent". */
    ariaValueText?: string
  }>(),
  {
    modelValue: 0,
    min: 0,
    max: 100,
    step: 1,
    largeStep: 10,
    disabled: false,
    orientation: 'horizontal',
    ariaValueText: undefined,
  },
)

const emit = defineEmits<{
  'update:modelValue': [value: number]
}>()

const el = ref<HTMLElement | null>(null)

const value = computed(() => props.modelValue)
const disabled = computed(() => props.disabled)
const orientation = computed(() => props.orientation)

const fraction = computed(() => {
  const span = props.max - props.min
  // A zero-width range has no meaningful position; anchoring at the start beats
  // dividing by zero and positioning the thumb at `NaN%`.
  if (span <= 0) return 0
  return Math.min(Math.max((props.modelValue - props.min) / span, 0), 1)
})

function commit(next: number) {
  const snapped = snap(next, props.min, props.max, props.step)
  if (snapped !== props.modelValue) emit('update:modelValue', snapped)
}

// Named `stepBy` because `step` is already a prop.
function stepBy(steps: number) {
  if (props.disabled) return
  const next = stepFrom(props.modelValue, props.min, props.max, props.step, steps)
  if (next !== props.modelValue) emit('update:modelValue', next)
}

/** Turns a pointer position on the track into a value. */
function valueAt(event: PointerEvent) {
  if (!el.value) return props.modelValue
  const rect = el.value.getBoundingClientRect()

  const ratio =
    props.orientation === 'vertical'
      ? // Vertical sliders run bottom-to-top, the way people read a level or a
        // volume fader — the opposite of the y axis.
        (rect.bottom - event.clientY) / rect.height
      : (event.clientX - rect.left) / rect.width

  return props.min + ratio * (props.max - props.min)
}

function onPointerdown(event: PointerEvent) {
  if (props.disabled) return

  // Capture so the drag keeps working past the edge of the track — a slider you
  // lose the moment the pointer strays a few pixels is worse than no drag.
  ;(event.target as HTMLElement).setPointerCapture?.(event.pointerId)
  commit(valueAt(event))
}

function onPointermove(event: PointerEvent) {
  // `buttons` rather than a dragging flag: it is the browser's own answer to
  // "is a button still held", and it stays right when the release happened in
  // another window.
  if (props.disabled || event.buttons === 0) return
  commit(valueAt(event))
}

function onKeydown(event: KeyboardEvent) {
  if (props.disabled) return

  switch (event.key) {
    case 'ArrowRight':
    case 'ArrowUp':
      event.preventDefault()
      return stepBy(1)
    case 'ArrowLeft':
    case 'ArrowDown':
      event.preventDefault()
      return stepBy(-1)
    case 'PageUp':
      event.preventDefault()
      return stepBy(props.largeStep)
    case 'PageDown':
      event.preventDefault()
      return stepBy(-props.largeStep)
    case 'Home':
      event.preventDefault()
      return commit(props.min)
    case 'End':
      event.preventDefault()
      return commit(props.max)
  }
}

provideSliderContext({ value, fraction, disabled, orientation })
</script>

<template>
  <div
    ref="el"
    role="slider"
    :tabindex="disabled ? -1 : 0"
    :aria-valuenow="value"
    :aria-valuemin="min"
    :aria-valuemax="max"
    :aria-valuetext="ariaValueText"
    :aria-orientation="orientation"
    :aria-disabled="disabled || undefined"
    :data-orientation="orientation"
    :data-disabled="disabled ? '' : undefined"
    :style="{ '--isoline-slider-fraction': fraction }"
    @pointerdown="onPointerdown"
    @pointermove="onPointermove"
    @keydown="onKeydown"
  >
    <slot :value="value" :fraction="fraction" />
  </div>
</template>
