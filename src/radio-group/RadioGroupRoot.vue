<script setup lang="ts">
/**
 * A set of mutually exclusive options, wrapping `<RadioGroupItem>`s.
 *
 * The group is one tab stop, not one per option — Tab enters it at the
 * selected item (or the first enabled one when nothing is selected) and the
 * arrow keys move between options, selecting as they go. That is what native
 * radios do, and doing anything else strands keyboard users in a long list.
 *
 * Ships no styles. When `name` is set a hidden input mirrors the selection so
 * the group still submits with its form.
 */
import { computed, shallowRef } from 'vue'
import { provideRadioGroupContext } from './context'
import { VISUALLY_HIDDEN } from '../shared/visuallyHidden'

const props = withDefaults(
  defineProps<{
    /** The selected item's value. Use with `v-model`. */
    modelValue?: string
    /** Rejects interaction for every item in the group. */
    disabled?: boolean
    /** Name for the mirrored hidden input. Omit outside a form. */
    name?: string
    /** Marks the mirrored input required, for native form validation. */
    required?: boolean
    /** Announced to assistive tech. Does not change which arrows navigate. */
    orientation?: 'horizontal' | 'vertical'
    /** Whether arrow navigation wraps past the ends, as native radios do. */
    loop?: boolean
  }>(),
  {
    modelValue: undefined,
    disabled: false,
    name: undefined,
    required: false,
    orientation: 'vertical',
    loop: true,
  },
)

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

// Items are tracked by element rather than by index: `v-for` with a `v-if`
// inside gives no stable index, and the order that matters for arrow keys is
// the order on screen. `shallowRef` because the elements are opaque to us —
// deep reactivity on a DOM node is expensive and buys nothing.
const registered = shallowRef<HTMLElement[]>([])

function register(el: HTMLElement) {
  registered.value = [...registered.value, el]
}

function unregister(el: HTMLElement) {
  registered.value = registered.value.filter((item) => item !== el)
}

function items() {
  return [...registered.value].sort((a, b) =>
    // DOCUMENT_POSITION_FOLLOWING: b comes after a, so a sorts first.
    a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1,
  )
}

const value = computed(() => props.modelValue)
const disabled = computed(() => props.disabled)
const loop = computed(() => props.loop)

function select(next: string) {
  if (props.disabled) return
  if (next === props.modelValue) return
  emit('update:modelValue', next)
}

provideRadioGroupContext({ value, disabled, loop, select, register, unregister, items })
</script>

<template>
  <div
    role="radiogroup"
    :aria-orientation="orientation"
    :aria-required="required || undefined"
    :data-disabled="disabled ? '' : undefined"
    :data-orientation="orientation"
  >
    <slot :value="value" :disabled="disabled" />

    <!--
      Mirrors the selection for native form submission. Kept as a radio rather
      than a hidden input so `required` still fails validation while nothing is
      selected — a hidden input is never validated.
    -->
    <input
      v-if="name"
      type="radio"
      tabindex="-1"
      aria-hidden="true"
      :name="name"
      :value="value ?? ''"
      :checked="value !== undefined"
      :disabled="disabled"
      :required="required"
      :style="VISUALLY_HIDDEN"
    />
  </div>
</template>
