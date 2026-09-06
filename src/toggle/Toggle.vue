<script setup lang="ts">
/**
 * A button that stays pressed.
 *
 * `aria-pressed` rather than `role="switch"` or a checkbox: a toggle button is
 * a button whose effect persists — bold in a toolbar, a filter that stays on.
 * A switch commits a setting, and announcing one as the other tells a screen
 * reader user the wrong thing about what pressing it does.
 */
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    /** Whether it is pressed. Use with `v-model`. */
    modelValue?: boolean
    /** Rejects interaction, and greys out for a11y tools. */
    disabled?: boolean
  }>(),
  { modelValue: false, disabled: false },
)

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const pressed = computed(() => props.modelValue)

function toggle() {
  if (props.disabled) return
  emit('update:modelValue', !props.modelValue)
}
</script>

<template>
  <button
    type="button"
    :aria-pressed="pressed"
    :disabled="disabled"
    :data-state="pressed ? 'on' : 'off'"
    :data-disabled="disabled ? '' : undefined"
    @click="toggle"
  >
    <slot :pressed="pressed" />
  </button>
</template>
