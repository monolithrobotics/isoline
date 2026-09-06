<script setup lang="ts">
/**
 * A sortable column header.
 *
 * `aria-sort` on the `<th>` and a real `<button>` inside it. The button matters:
 * a `<th>` with a click handler is invisible to the keyboard, and putting
 * `tabindex` and a key handler on it reimplements a button badly.
 */
import { computed } from 'vue'
import { injectDataTableContext } from './context'

const props = defineProps<{
  /** Matches the id passed to the root's `getSortValue`. */
  columnId: string
}>()

const { sort, toggleSort } = injectDataTableContext()

const direction = computed(() =>
  sort.value?.by === props.columnId ? sort.value.direction : undefined,
)
</script>

<template>
  <th scope="col" :aria-sort="direction ?? 'none'" :data-state="direction ?? 'unsorted'">
    <button type="button" @click="toggleSort(columnId)">
      <slot :direction="direction" />
    </button>
  </th>
</template>
