<script setup lang="ts">
/**
 * The show/hide button.
 *
 * Type `button` and outside the form's submit path, because a field with a
 * visibility toggle is usually the last control before Enter, and a toggle
 * that submitted the form instead would be maddening.
 */
import { injectPasswordFieldContext } from './context'

const { visible, inputId, toggleVisibility } = injectPasswordFieldContext()
</script>

<template>
  <button
    type="button"
    :aria-pressed="visible"
    :aria-controls="inputId"
    :data-state="visible ? 'visible' : 'masked'"
    @click="toggleVisibility"
  >
    <slot :visible="visible" />
  </button>
</template>
