<script setup lang="ts">
/**
 * The backdrop behind a modal dialog.
 *
 * Clicking it closes, which is the convention users expect; set
 * `:close-on-click="false"` for a dialog that must be answered — a destructive
 * confirmation, an unsaved-changes prompt — where a stray click outside should
 * not count as a decision.
 */
import { injectDialogContext } from './context'

const props = withDefaults(
  defineProps<{
    /** Whether clicking the backdrop closes the dialog. */
    closeOnClick?: boolean
  }>(),
  { closeOnClick: true },
)

const { open, close } = injectDialogContext()

function onPointerdown() {
  if (props.closeOnClick) close()
}
</script>

<template>
  <!--
    `pointerdown`, not `click`: a click that starts inside the panel and ends
    on the backdrop — releasing the mouse after selecting text, dragging a
    slider past the edge — fires `click` on the overlay and would close the
    dialog out from under a user who was working in it.
  -->
  <div v-if="open" aria-hidden="true" data-state="open" @pointerdown="onPointerdown">
    <slot />
  </div>
</template>
