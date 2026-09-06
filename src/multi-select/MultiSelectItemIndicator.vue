<script setup lang="ts">
/**
 * The tick beside a chosen option.
 *
 * `force-mount` keeps it in the DOM in every state, for lists that reserve the
 * space so labels do not shift as choices are made.
 */
import { injectMultiSelectItemContext } from './context'

withDefaults(defineProps<{ forceMount?: boolean }>(), { forceMount: false })

const { selected } = injectMultiSelectItemContext()
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
