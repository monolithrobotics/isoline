<script setup lang="ts">
/**
 * The filled part of the track, from the start to the current value.
 *
 * Sized from the same fraction the root publishes, so it cannot drift out of
 * step with the thumb.
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
