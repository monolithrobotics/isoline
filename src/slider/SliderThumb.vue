<script setup lang="ts">
/**
 * The draggable knob.
 *
 * Positioned from the same fraction the root publishes. Not focusable and not
 * a `role="slider"` of its own: the root carries both, so there is one tab
 * stop and one thing for a screen reader to announce.
 */
import { injectSliderContext } from './context'

const { fraction, disabled, orientation } = injectSliderContext()
</script>

<template>
  <div
    aria-hidden="true"
    :data-orientation="orientation"
    :data-disabled="disabled ? '' : undefined"
    :style="{ '--isoline-slider-fraction': fraction }"
  >
    <slot />
  </div>
</template>
