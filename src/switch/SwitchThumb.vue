<script setup lang="ts">
/**
 * The moving knob inside a `<SwitchRoot>`.
 *
 * Exists as its own component only so the consumer has an element to animate
 * and to style off `data-state` without reaching into the root's slot markup
 * with a descendant selector.
 */
import { injectSwitchContext } from './context'

const { checked, disabled } = injectSwitchContext()
</script>

<template>
  <span
    :data-state="checked ? 'checked' : 'unchecked'"
    :data-disabled="disabled ? '' : undefined"
  >
    <slot />
  </span>
</template>
