<script setup lang="ts">
/**
 * Wraps whatever the tooltip describes.
 *
 * Renders no element of its own — it binds handlers and `aria-describedby`
 * onto the single child you give it, so the trigger stays your `<button>` with
 * your markup, and the tooltip does not add a wrapper that changes layout.
 */
import { onMounted, ref } from 'vue'
import { injectTooltipContext } from './context'

const { open, contentId, triggerEl, openAfterDelay, openNow, close } =
  injectTooltipContext()

const wrapper = ref<HTMLElement | null>(null)

// `display: contents` leaves the wrapper without a layout box, so measuring it
// would anchor the tooltip at 0,0 — the child is the thing actually on screen.
onMounted(() => {
  triggerEl.value =
    (wrapper.value?.firstElementChild as HTMLElement | null) ?? wrapper.value
})

function onFocus(event: FocusEvent) {
  // Only keyboard focus: `:focus-visible` semantics, so clicking a button does
  // not leave a tooltip hanging over what the user just pressed.
  const target = event.target as HTMLElement
  if (target.matches(':focus-visible')) openNow()
}
</script>

<template>
  <span
    ref="wrapper"
    style="display: contents"
    :aria-describedby="open ? contentId : undefined"
    @pointerenter="openAfterDelay"
    @pointerleave="close"
    @pointerdown="close"
    @focusin="onFocus"
    @focusout="close"
  >
    <slot />
  </span>
</template>
