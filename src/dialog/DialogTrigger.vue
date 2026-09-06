<script setup lang="ts">
/**
 * The button that opens the dialog.
 *
 * Optional — a dialog opened from a menu item or from code needs no trigger,
 * and focus still returns to wherever it came from, because the content
 * remembers what was focused rather than asking a trigger that may not exist.
 */
import { injectDialogContext } from './context'

const { open, show, contentId } = injectDialogContext()
</script>

<template>
  <button
    type="button"
    aria-haspopup="dialog"
    :aria-expanded="open"
    :aria-controls="open ? contentId : undefined"
    :data-state="open ? 'open' : 'closed'"
    @click="show"
  >
    <slot :open="open" />
  </button>
</template>
