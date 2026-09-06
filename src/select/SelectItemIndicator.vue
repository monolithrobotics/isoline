<script setup lang="ts">
/**
 * The tick beside the selected option.
 *
 * Renders nothing for the others, so a consumer can drop an SVG straight into
 * the slot. `force-mount` keeps it in the DOM in every state, for lists that
 * reserve the space so labels do not shift when the selection moves.
 */
import { injectSelectItemContext } from './itemContext'

withDefaults(
  defineProps<{
    /** Render in every state, leaving visibility to CSS. */
    forceMount?: boolean
  }>(),
  { forceMount: false },
)

const { selected } = injectSelectItemContext()
</script>

<template>
  <span
    v-if="selected || forceMount"
    :data-state="selected ? 'checked' : 'unchecked'"
    aria-hidden="true"
  >
    <slot />
  </span>
</template>
