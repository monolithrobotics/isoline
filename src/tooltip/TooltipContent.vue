<script setup lang="ts">
/**
 * The tooltip itself.
 *
 * `role="tooltip"`, anchored to the trigger and re-measured while open,
 * because the page under a fixed element keeps moving. Escape closes it, which
 * WCAG requires of anything that appears on hover.
 */
import { onBeforeUnmount, ref, watch } from 'vue'
import { injectTooltipContext } from './context'
import { anchorBelow } from '../shared/anchor'

const props = withDefaults(
  defineProps<{
    /** Gap between the trigger and the tooltip, in pixels. */
    sideOffset?: number
  }>(),
  { sideOffset: 6 },
)

const { open, contentId, triggerEl, close } = injectTooltipContext()

const el = ref<HTMLElement | null>(null)
const side = ref<'top' | 'bottom'>('bottom')
const style = ref<Record<string, string>>({})

function reposition() {
  if (!el.value || !triggerEl.value) return
  const placed = anchorBelow(triggerEl.value, el.value, { offset: props.sideOffset })
  side.value = placed.side
  style.value = { position: 'fixed', top: `${placed.top}px`, left: `${placed.left}px` }
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') close()
}

function teardown() {
  document.removeEventListener('keydown', onKeydown)
  // `capture` for scroll: scrolling happens on whichever ancestor overflows,
  // and those events do not bubble to the document.
  window.removeEventListener('scroll', reposition, true)
  window.removeEventListener('resize', reposition)
}

watch(
  open,
  (isOpen, _was, onCleanup) => {
    if (!isOpen) return
    reposition()
    document.addEventListener('keydown', onKeydown)
    window.addEventListener('scroll', reposition, true)
    window.addEventListener('resize', reposition)
    onCleanup(teardown)
  },
  { immediate: true, flush: 'post' },
)

onBeforeUnmount(teardown)
</script>

<template>
  <div
    v-if="open"
    :id="contentId"
    ref="el"
    role="tooltip"
    data-state="open"
    :data-side="side"
    :style="style"
  >
    <slot />
  </div>
</template>
