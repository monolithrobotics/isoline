<script setup lang="ts">
/**
 * The header checkbox.
 *
 * Indeterminate while some rows are selected. `indeterminate` is a DOM
 * property with no attribute, so it is set on the element rather than bound —
 * which is why this exists as a part instead of being left to the consumer.
 */
import { computed, ref, watchEffect } from 'vue'
import { injectDataTableContext } from './context'

const { allSelected, someSelected, toggleAll } = injectDataTableContext()

const el = ref<HTMLInputElement | null>(null)

// `flush: 'post'` because this writes to the DOM: on the default pre-flush the
// effect can run before the element it targets has been patched in.
watchEffect(
  () => {
    if (el.value) el.value.indeterminate = someSelected.value
  },
  { flush: 'post' },
)

const state = computed(() => {
  if (allSelected.value) return 'checked'
  return someSelected.value ? 'indeterminate' : 'unchecked'
})
</script>

<template>
  <input
    ref="el"
    type="checkbox"
    :checked="allSelected"
    :aria-checked="someSelected ? 'mixed' : allSelected"
    :data-state="state"
    @change="toggleAll"
  />
</template>
