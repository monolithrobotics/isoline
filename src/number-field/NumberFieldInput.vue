<script setup lang="ts">
/**
 * The text field itself.
 *
 * `inputmode="numeric"` on a `type="text"` input rather than
 * `type="number"`: the native number input silently discards what it cannot
 * parse, so a mistyped character takes the rest of the number with it, and its
 * scroll-wheel stepping changes values under a user who was only scrolling the
 * page.
 *
 * Text is committed on blur and on Enter, not on every keystroke — otherwise
 * typing "-5" is a value of `-` (rejected) followed by `-5`, and clamping
 * would fight the user mid-word.
 */
import { computed, ref, watch } from 'vue'
import { injectNumberFieldContext } from './context'

const { value, disabled, step, largeStep, min, max, stepSize, name, required, commit } =
  injectNumberFieldContext()

const text = ref(value.value === undefined ? '' : String(value.value))

// The parent owns the value, so anything that changes it — a stepper, a slider
// bound to the same ref, a server response — has to be reflected here.
watch(value, (next) => {
  const canonical = next === undefined ? '' : String(next)
  if (Number(text.value) !== next || text.value.trim() === '') text.value = canonical
})

function onKeydown(event: KeyboardEvent) {
  switch (event.key) {
    case 'ArrowUp':
      event.preventDefault()
      return step(1)
    case 'ArrowDown':
      event.preventDefault()
      return step(-1)
    case 'PageUp':
      event.preventDefault()
      return step(largeStep.value)
    case 'PageDown':
      event.preventDefault()
      return step(-largeStep.value)
    case 'Enter':
      // Not prevented: a field inside a form should still submit it.
      return commit(text.value)
  }
}

const ariaMin = computed(() => (Number.isFinite(min.value) ? min.value : undefined))
const ariaMax = computed(() => (Number.isFinite(max.value) ? max.value : undefined))
</script>

<template>
  <input
    v-model="text"
    type="text"
    inputmode="numeric"
    autocomplete="off"
    role="spinbutton"
    :name="name"
    :required="required"
    :disabled="disabled"
    :aria-valuenow="value"
    :aria-valuemin="ariaMin"
    :aria-valuemax="ariaMax"
    :data-disabled="disabled ? '' : undefined"
    :step="stepSize"
    @keydown="onKeydown"
    @blur="commit(text)"
  />
</template>
