<script setup lang="ts">
/**
 * The popup list.
 *
 * Positioned against the trigger in viewport coordinates and re-measured while
 * open, because the page under a `position: fixed` popup keeps moving: an
 * ancestor scrolls, the window resizes, an image loads and reflows the row the
 * trigger sits in.
 *
 * Carries no keyboard handling of its own — every key is handled on the
 * trigger, which is where focus stays.
 */
import { onBeforeUnmount, ref, watch } from 'vue'
import { injectSelectContext } from './context'
import { anchorBelow } from '../shared/anchor'

const props = withDefaults(
  defineProps<{
    /** Gap between the trigger and the list, in pixels. */
    sideOffset?: number
    /** Whether the list matches the trigger's width, as a native select does. */
    matchTriggerWidth?: boolean
  }>(),
  { sideOffset: 4, matchTriggerWidth: true },
)

const { open, contentId, triggerId, triggerEl, setOpen } = injectSelectContext()

const el = ref<HTMLElement | null>(null)
const side = ref<'top' | 'bottom'>('bottom')
const style = ref<Record<string, string>>({})

function reposition() {
  if (!el.value || !triggerEl.value) return

  if (props.matchTriggerWidth) {
    el.value.style.width = `${triggerEl.value.offsetWidth}px`
  }

  const placed = anchorBelow(triggerEl.value, el.value, { offset: props.sideOffset })
  side.value = placed.side
  style.value = {
    position: 'fixed',
    top: `${placed.top}px`,
    left: `${placed.left}px`,
  }
}

function onPointerdown(event: PointerEvent) {
  const target = event.target as Node | null
  if (el.value?.contains(target ?? null)) return
  // The trigger closes on its own click; letting this close it too would toggle
  // twice and leave the list open.
  if (triggerEl.value?.contains(target ?? null)) return
  setOpen(false)
}

function teardown() {
  document.removeEventListener('pointerdown', onPointerdown)
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
    document.addEventListener('pointerdown', onPointerdown)
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
    role="listbox"
    :aria-labelledby="triggerId"
    :data-state="open ? 'open' : 'closed'"
    :data-side="side"
    :style="style"
  >
    <slot />
  </div>
</template>
