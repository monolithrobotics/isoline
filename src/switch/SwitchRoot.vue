<script setup lang="ts">
/**
 * An on/off control, rendered as a `<button role="switch">`.
 *
 * A switch is not a checkbox: it commits immediately rather than on form
 * submit, which is why the visible control is a button and the ARIA role says
 * `switch`. When `name` is set a hidden checkbox mirrors the state so the
 * control still participates in native form submission.
 *
 * Ships no styles. State is exposed through `data-state` / `data-disabled`
 * so the consumer's own CSS can key off it:
 *
 * ```css
 * .my-switch[data-state='checked'] { background: var(--accent); }
 * ```
 */
import { computed } from 'vue'
import { provideSwitchContext } from './context'
import { VISUALLY_HIDDEN } from '../shared/visuallyHidden'

/**
 * The mirrored input is a sibling of the control, so this component has more
 * than one root node and Vue therefore refuses to place fallthrough
 * attributes automatically. Left to itself it drops `class`, `id` and
 * `aria-label` on the floor — and for an unstyled primitive, dropping `class`
 * means the consumer's control renders invisible.
 *
 * So they are bound onto the button explicitly: that is the element the
 * consumer means when they write them, and `id` there is what lets a sibling
 * `<label for>` name it and forward its clicks (`<button>` is labelable).
 * `v-bind="$attrs"` sits **first** in the attribute list so everything below
 * it wins — `role`, `aria-checked` and `data-state` are this component's
 * contract, not a default for the consumer to overwrite.
 */
defineOptions({ inheritAttrs: false })

const props = withDefaults(
  defineProps<{
    /** Whether the switch is on. Use with `v-model`. */
    modelValue?: boolean
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
  'update:modelValue': [value: boolean]
}>()

const checked = computed(() => props.modelValue)
const disabled = computed(() => props.disabled)

provideSwitchContext({ checked, disabled })

function toggle() {
  if (props.disabled) return
  emit('update:modelValue', !props.modelValue)
}
</script>

<template>
  <button
    v-bind="$attrs"
    type="button"
    role="switch"
    :aria-checked="checked"
    :aria-required="required || undefined"
    :disabled="disabled"
    :data-state="checked ? 'checked' : 'unchecked'"
    :data-disabled="disabled ? '' : undefined"
    @click="toggle"
  >
    <slot :checked="checked" :disabled="disabled" />
  </button>

  <!--
    Mirrors state for native form submission. `<button>` carries no value, and
    a switch that silently drops out of its form's payload is a bug the
    consumer only finds server-side.
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
