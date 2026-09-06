<script setup lang="ts">
/**
 * The divider between two panes.
 *
 * `role="separator"` with `tabindex="0"` — a separator is only focusable when
 * it can be moved, and this one can. Arrow keys resize it, which is the whole
 * reason to render an element here rather than a border: a border cannot be
 * dragged by someone who is not using a mouse.
 */
import { computed, ref } from 'vue'
import { injectSplitterContext } from './context'

const props = withDefaults(
  defineProps<{
    /** How far one arrow press moves the boundary, in percent. */
    step?: number
    /** How far Page Up and Page Down move it. */
    largeStep?: number
  }>(),
  { step: 1, largeStep: 10 },
)

const { sizes, orientation, disabled, resizeAt, boundaryOf, panels } =
  injectSplitterContext()

const el = ref<HTMLElement | null>(null)

const boundary = computed(() => (el.value ? boundaryOf(el.value) : undefined))

/** The share of the pane before the divider, which is what `aria-valuenow` means. */
const value = computed(() => {
  const at = boundary.value
  return at ? Math.round(sizes.value[at.before] ?? 0) : 0
})

const limits = computed(() => {
  const at = boundary.value
  if (!at) return { min: 0, max: 100 }
  const ordered = panels()
  const total = (sizes.value[at.before] ?? 0) + (sizes.value[at.after] ?? 0)
  return {
    min: Math.round(ordered[at.before]!.minSize),
    max: Math.round(total - ordered[at.after]!.minSize),
  }
})

/** The container's length along the axis being resized. */
function axisSize() {
  const container = el.value?.parentElement
  if (!container) return 0
  return orientation.value === 'vertical' ? container.offsetHeight : container.offsetWidth
}

function move(deltaPercent: number) {
  if (!el.value) return
  resizeAt(el.value, deltaPercent)
}

function onPointerdown(event: PointerEvent) {
  if (disabled.value) return
  // Capture so the drag survives the pointer leaving the handle — a divider
  // you lose the moment you move faster than it is not draggable.
  ;(event.target as HTMLElement).setPointerCapture?.(event.pointerId)
}

function onPointermove(event: PointerEvent) {
  // `buttons` rather than a dragging flag: it is the browser's own answer to
  // "is a button still held", and it stays right when the release happened in
  // another window.
  if (disabled.value || event.buttons === 0) return

  const length = axisSize()
  if (length === 0) return

  const deltaPx = orientation.value === 'vertical' ? event.movementY : event.movementX
  move((deltaPx / length) * 100)
}

function onKeydown(event: KeyboardEvent) {
  if (disabled.value) return

  const forward = orientation.value === 'vertical' ? 'ArrowDown' : 'ArrowRight'
  const back = orientation.value === 'vertical' ? 'ArrowUp' : 'ArrowLeft'

  switch (event.key) {
    case forward:
      event.preventDefault()
      return move(props.step)
    case back:
      event.preventDefault()
      return move(-props.step)
    case 'PageDown':
      event.preventDefault()
      return move(props.largeStep)
    case 'PageUp':
      event.preventDefault()
      return move(-props.largeStep)
    case 'Home':
      event.preventDefault()
      return move(limits.value.min - value.value)
    case 'End':
      event.preventDefault()
      return move(limits.value.max - value.value)
  }
}
</script>

<template>
  <div
    ref="el"
    role="separator"
    :tabindex="disabled ? -1 : 0"
    :aria-orientation="orientation"
    :aria-valuenow="value"
    :aria-valuemin="limits.min"
    :aria-valuemax="limits.max"
    :aria-disabled="disabled || undefined"
    :data-orientation="orientation"
    :data-disabled="disabled ? '' : undefined"
    @pointerdown="onPointerdown"
    @pointermove="onPointermove"
    @keydown="onKeydown"
  >
    <slot />
  </div>
</template>
