<script setup lang="ts">
/**
 * A number input with steppers, arrow keys and a range.
 *
 * The value is a `number | undefined`, never a string: an empty field is
 * `undefined` rather than `0`, because "not filled in yet" and "zero" are
 * different answers and a form that cannot tell them apart will submit the
 * wrong one.
 *
 * ```vue
 * <NumberFieldRoot v-model="altitude" :min="0" :max="120" :step="5">
 *   <NumberFieldDecrement>−</NumberFieldDecrement>
 *   <NumberFieldInput />
 *   <NumberFieldIncrement>+</NumberFieldIncrement>
 * </NumberFieldRoot>
 * ```
 */
import { computed } from 'vue'
import { provideNumberFieldContext } from './context'
import { snap, stepFrom } from '../shared/number'

const props = withDefaults(
  defineProps<{
    /** The current value. Use with `v-model`. `undefined` is an empty field. */
    modelValue?: number
    /** Smallest accepted value. */
    min?: number
    /** Largest accepted value. */
    max?: number
    /** Granularity of the steppers and the arrow keys. */
    step?: number
    /** Multiplier applied by Page Up and Page Down. */
    largeStep?: number
    /** Rejects interaction, and greys out for a11y tools. */
    disabled?: boolean
    /** Name for the input, so the field submits with its form. */
    name?: string
    /** Marks the input required, for native form validation. */
    required?: boolean
  }>(),
  {
    modelValue: undefined,
    min: Number.NEGATIVE_INFINITY,
    max: Number.POSITIVE_INFINITY,
    step: 1,
    largeStep: 10,
    disabled: false,
    name: undefined,
    required: false,
  },
)

const emit = defineEmits<{
  'update:modelValue': [value: number | undefined]
}>()

const value = computed(() => props.modelValue)
const disabled = computed(() => props.disabled)

/** Where stepping starts from an empty field: the range's floor, or zero. */
const origin = computed(() => (Number.isFinite(props.min) ? props.min : 0))

const canIncrement = computed(
  () =>
    !props.disabled && (props.modelValue === undefined || props.modelValue < props.max),
)
const canDecrement = computed(
  () =>
    !props.disabled && (props.modelValue === undefined || props.modelValue > props.min),
)

// Named `stepBy` because `step` is already a prop, and a script binding that
// shadows one is a collision waiting for someone to rename the wrong thing.
function stepBy(direction: number) {
  if (props.disabled) return

  // An empty field steps to the origin itself rather than one step past it —
  // pressing "up" on an empty field bounded at 0 should give 0, not 1.
  if (props.modelValue === undefined) {
    return emit('update:modelValue', snap(origin.value, props.min, props.max, props.step))
  }

  emit(
    'update:modelValue',
    stepFrom(props.modelValue, props.min, props.max, props.step, direction),
  )
}

/** Commits raw input text. Exposed to the input part, not to consumers. */
function commit(text: string) {
  if (props.disabled) return

  const trimmed = text.trim()
  if (trimmed === '') return emit('update:modelValue', undefined)

  const parsed = Number(trimmed)
  // Anything unparseable leaves the value alone: the input keeps the user's
  // text so they can fix a typo, rather than having it silently replaced.
  if (!Number.isFinite(parsed)) return

  emit('update:modelValue', snap(parsed, props.min, props.max, props.step))
}

provideNumberFieldContext({
  value,
  disabled,
  canIncrement,
  canDecrement,
  step: stepBy,
  largeStep: computed(() => props.largeStep),
  min: computed(() => props.min),
  max: computed(() => props.max),
  stepSize: computed(() => props.step),
  name: computed(() => props.name),
  required: computed(() => props.required),
  commit,
})
</script>

<template>
  <slot :value="value" :disabled="disabled" />
</template>
