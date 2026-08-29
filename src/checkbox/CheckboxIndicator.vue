<script setup lang="ts">
/**
 * The tick inside a `<CheckboxRoot>`.
 *
 * Renders nothing at all while the box is unchecked, so a consumer can put an
 * SVG tick straight in the slot without having to hide it themselves. Set
 * `force-mount` to keep it in the DOM in every state — needed when the tick is
 * animated out rather than removed.
 */
import { computed } from 'vue'
import { injectCheckboxContext, checkboxDataState } from './context'

withDefaults(
  defineProps<{
    /** Render in every state, leaving visibility to CSS. For transitions. */
    forceMount?: boolean
  }>(),
  { forceMount: false },
)

const { state, disabled } = injectCheckboxContext()

const present = computed(() => state.value !== false)
</script>

<template>
  <span
    v-if="present || forceMount"
    :data-state="checkboxDataState(state)"
    :data-disabled="disabled ? '' : undefined"
  >
    <slot :state="state" />
  </span>
</template>
