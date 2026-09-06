<script setup lang="ts">
/**
 * The step-up button.
 *
 * `aria-hidden` and not tab-reachable: the input already handles Up and Down,
 * and a screen-reader user meets the spinbutton before these — two extra tab
 * stops that do nothing new are noise, not access.
 */
import { injectNumberFieldContext } from './context'

const { canIncrement, step } = injectNumberFieldContext()
</script>

<template>
  <button
    type="button"
    tabindex="-1"
    aria-hidden="true"
    :disabled="!canIncrement"
    :data-disabled="canIncrement ? undefined : ''"
    @click="step(1)"
  >
    <slot />
  </button>
</template>
