<script setup lang="ts">
/**
 * One pane.
 *
 * Publishes its share as `--isoline-splitter-size`, a percentage, and imposes
 * no layout of its own — the consumer decides whether that is a flex basis, a
 * grid track or a width.
 */
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { injectSplitterContext } from './context'

const props = withDefaults(
  defineProps<{
    /** Smallest share this panel accepts, in percent. */
    minSize?: number
  }>(),
  { minSize: 0 },
)

const { sizeOf, registerPanel, unregisterPanel } = injectSplitterContext()

const el = ref<HTMLElement | null>(null)
const size = ref(0)

onMounted(() => {
  if (!el.value) return
  registerPanel({ el: el.value, minSize: props.minSize })
  size.value = sizeOf(el.value)
})

onBeforeUnmount(() => {
  if (el.value) unregisterPanel(el.value)
})

// Read through a computed rather than cached, so a drag on any handle in the
// splitter reaches every panel it moved.
const share = computed(() => (el.value ? sizeOf(el.value) : size.value))
</script>

<template>
  <div ref="el" data-isoline-panel :style="{ '--isoline-splitter-size': `${share}%` }">
    <slot :size="share" />
  </div>
</template>
