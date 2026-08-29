<script setup lang="ts">
/**
 * The dot inside a `<RadioGroupItem>`.
 *
 * Renders nothing while its item is unselected. Set `force-mount` to keep it
 * in the DOM in every state — needed when the dot is animated out rather than
 * removed.
 */
import { injectRadioGroupItemContext } from './context'

withDefaults(
  defineProps<{
    /** Render in every state, leaving visibility to CSS. For transitions. */
    forceMount?: boolean
  }>(),
  { forceMount: false },
)

const { checked, disabled } = injectRadioGroupItemContext()
</script>

<template>
  <span
    v-if="checked || forceMount"
    :data-state="checked ? 'checked' : 'unchecked'"
    :data-disabled="disabled ? '' : undefined"
  >
    <slot />
  </span>
</template>
