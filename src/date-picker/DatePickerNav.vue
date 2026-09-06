<script setup lang="ts">
/**
 * A previous/next month button.
 *
 * Moves the view without moving the selection or the keyboard's day — paging
 * to look at March should not select anything, and should not drag the focused
 * day along with it.
 */
import { injectDatePickerContext } from './context'

const props = withDefaults(
  defineProps<{
    /** How many months to move. Negative goes back. */
    months?: number
  }>(),
  { months: 1 },
)

const { disabled, shiftMonth } = injectDatePickerContext()
</script>

<template>
  <button type="button" :disabled="disabled" @click="shiftMonth(props.months)">
    <slot />
  </button>
</template>
