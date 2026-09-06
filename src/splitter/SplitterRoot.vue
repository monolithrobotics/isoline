<script setup lang="ts">
/**
 * Resizable panes with a draggable divider.
 *
 * Sizes are percentages, not pixels: a split kept in pixels is wrong the moment
 * the window changes, and restoring "the map was 640px" onto a narrower screen
 * gives a layout nobody chose.
 *
 * Like every other part here it imposes no layout. Each panel publishes its
 * share as `--isoline-splitter-size`, and the consumer decides what that means
 * — a flex basis, a grid track, a width.
 *
 * ```vue
 * <SplitterRoot v-model:sizes="split" class="row">
 *   <SplitterPanel :min-size="30">map</SplitterPanel>
 *   <SplitterHandle />
 *   <SplitterPanel :min-size="20">details</SplitterPanel>
 * </SplitterRoot>
 * ```
 *
 * ```css
 * .row { display: flex; }
 * .row > [data-isoline-panel] { flex-basis: var(--isoline-splitter-size); }
 * ```
 */
import { computed, ref } from 'vue'
import { provideSplitterContext, type SplitterPanel } from './context'

const props = withDefaults(
  defineProps<{
    /** Each panel's share, in percent. Use with `v-model:sizes`. */
    sizes?: readonly number[]
    /** Whether panels sit side by side or stacked. */
    orientation?: 'horizontal' | 'vertical'
    /** Rejects dragging and the keyboard. */
    disabled?: boolean
  }>(),
  { sizes: undefined, orientation: 'horizontal', disabled: false },
)

const emit = defineEmits<{
  'update:sizes': [sizes: number[]]
}>()

const el = ref<HTMLElement | null>(null)
const registered = ref<SplitterPanel[]>([])

function registerPanel(panel: SplitterPanel) {
  registered.value = [...registered.value, panel]
}

function unregisterPanel(target: HTMLElement) {
  registered.value = registered.value.filter((panel) => panel.el !== target)
}

function panels(): SplitterPanel[] {
  return [...registered.value].sort((a, b) =>
    a.el.compareDocumentPosition(b.el) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1,
  )
}

// An equal split until told otherwise, so a splitter works before anyone has
// dragged it and without the consumer having to compute an initial array.
const sizes = computed<readonly number[]>(() => {
  const count = registered.value.length
  if (props.sizes && props.sizes.length === count) return props.sizes
  return count === 0 ? [] : Array.from({ length: count }, () => 100 / count)
})

function sizeOf(target: HTMLElement) {
  const index = panels().findIndex((panel) => panel.el === target)
  return index === -1 ? 0 : (sizes.value[index] ?? 0)
}

function boundaryOf(handle: HTMLElement) {
  const ordered = panels()

  // The last panel that precedes the handle, and the one after it. Only those
  // two move: dragging one divider must not shuffle the panes beyond it.
  let before = -1
  ordered.forEach((panel, index) => {
    if (panel.el.compareDocumentPosition(handle) & Node.DOCUMENT_POSITION_FOLLOWING) {
      before = index
    }
  })

  const after = before + 1
  if (before === -1 || after >= ordered.length) return undefined
  return { before, after }
}

function resizeAt(handle: HTMLElement, deltaPercent: number) {
  if (props.disabled) return

  const boundary = boundaryOf(handle)
  if (!boundary) return

  const ordered = panels()
  const current = [...sizes.value]
  const { before, after } = boundary

  const minBefore = ordered[before]!.minSize
  const minAfter = ordered[after]!.minSize
  const total = (current[before] ?? 0) + (current[after] ?? 0)

  // Clamped against both minimums so a drag past one pane's floor stops there
  // instead of pushing the other below its own.
  const nextBefore = Math.min(
    Math.max((current[before] ?? 0) + deltaPercent, minBefore),
    total - minAfter,
  )
  if (nextBefore === current[before]) return

  current[before] = nextBefore
  current[after] = total - nextBefore
  emit('update:sizes', current)
}

provideSplitterContext({
  sizes,
  orientation: computed(() => props.orientation),
  disabled: computed(() => props.disabled),
  registerPanel,
  unregisterPanel,
  panels,
  sizeOf,
  resizeAt,
  boundaryOf,
})

defineExpose({ el })
</script>

<template>
  <div
    ref="el"
    :data-orientation="orientation"
    :data-disabled="disabled ? '' : undefined"
  >
    <slot :sizes="sizes" />
  </div>
</template>
