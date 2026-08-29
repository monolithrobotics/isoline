<script setup lang="ts">
/**
 * A tri-state checkbox, rendered as a `<button role="checkbox">`.
 *
 * A `<button>` rather than `<input type="checkbox">` because the third state
 * has no native representation that survives a round trip: the DOM's
 * `indeterminate` is a property, not an attribute, so it cannot be expressed
 * in markup and is silently lost by anything that re-renders from HTML.
 * `aria-checked="mixed"` can. When `name` is set a hidden input mirrors the
 * state so the control still submits with its form.
 *
 * Ships no styles. State is exposed through `data-state` / `data-disabled`:
 *
 * ```css
 * .my-box[data-state='checked'] { background: var(--accent); }
 * .my-box[data-state='indeterminate'] { background: var(--accent-dim); }
 * ```
 */
import { computed } from 'vue'
import { provideCheckboxContext, checkboxDataState, type CheckboxState } from './context'
import { VISUALLY_HIDDEN } from '../shared/visuallyHidden'

const props = withDefaults(
  defineProps<{
    /** Whether the box is ticked. `'indeterminate'` for the mixed state. */
    modelValue?: CheckboxState
    /** Rejects pointer and keyboard interaction, and greys out for a11y tools. */
    disabled?: boolean
    /** Name for the mirrored hidden input. Omit outside a form. */
    name?: string
    /** Value submitted when checked. Matches the native checkbox default. */
    value?: string
    /** Marks the mirrored input required, for native form validation. */
    required?: boolean
  }>(),
  {
    modelValue: false,
    disabled: false,
    name: undefined,
    value: 'on',
    required: false,
  },
)

const emit = defineEmits<{
  'update:modelValue': [value: CheckboxState]
}>()

const state = computed(() => props.modelValue)
const disabled = computed(() => props.disabled)
const checked = computed(() => props.modelValue === true)

provideCheckboxContext({ state, disabled })

function toggle() {
  if (props.disabled) return
  // Indeterminate resolves to checked, never to unchecked. The mixed state
  // means "some children are on"; the useful next step is turning the rest
  // on, and it is what every native tri-state control does.
  emit('update:modelValue', props.modelValue === true ? false : true)
}
</script>

<template>
  <button
    type="button"
    role="checkbox"
    :aria-checked="state === 'indeterminate' ? 'mixed' : state"
    :aria-required="required || undefined"
    :disabled="disabled"
    :data-state="checkboxDataState(state)"
    :data-disabled="disabled ? '' : undefined"
    @click="toggle"
  >
    <slot :state="state" :checked="checked" :disabled="disabled" />
  </button>

  <!--
    Mirrors state for native form submission. `<button>` carries no value, and
    a checkbox that silently drops out of its form's payload is a bug the
    consumer only finds server-side. An indeterminate box submits nothing,
    which is what the native control does too.
  -->
  <input
    v-if="name"
    type="checkbox"
    tabindex="-1"
    aria-hidden="true"
    :name="name"
    :value="value"
    :checked="checked"
    :disabled="disabled"
    :required="required"
    :style="VISUALLY_HIDDEN"
  />
</template>
