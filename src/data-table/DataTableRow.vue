<script setup lang="ts">
/**
 * A row that can be selected.
 *
 * Selection lives on the row rather than on a checkbox inside it, so a whole
 * row is a target for the pointer. The checkbox — `DataTableRowCheckbox`, or
 * your own — stays for the keyboard and for anyone who expects one.
 */
import { computed } from 'vue'
import { injectDataTableContext } from './context'

const props = withDefaults(
  defineProps<{
    /** The row's key, from the root's `rowKey`. */
    rowKey: string
    /** Whether this row rejects selection. */
    disabled?: boolean
  }>(),
  { disabled: false },
)

const { isSelected, toggleRow, selectRange } = injectDataTableContext()

const selected = computed(() => isSelected(props.rowKey))

function onClick(event: MouseEvent) {
  if (props.disabled) return

  // Anything the user clicked that does something of its own — a link, a menu
  // button, the row's own checkbox — keeps its meaning. Row selection is what
  // is left over, not an override.
  const target = event.target as HTMLElement
  if (target.closest('a, button, input, select, textarea, [role="button"]')) return

  if (event.shiftKey) return selectRange(props.rowKey)
  toggleRow(props.rowKey)
}
</script>

<template>
  <tr
    :aria-selected="selected"
    :data-state="selected ? 'selected' : 'unselected'"
    :data-disabled="disabled ? '' : undefined"
    @click="onClick"
  >
    <slot :selected="selected" />
  </tr>
</template>
