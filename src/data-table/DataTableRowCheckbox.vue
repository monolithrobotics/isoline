<script setup lang="ts">
/**
 * The per-row checkbox.
 *
 * A native `<input type="checkbox">` rather than our own `Checkbox`: inside a
 * table it needs no third state, and the native control brings the label
 * association, the form behaviour and the platform's own focus ring for free.
 */
import { computed } from 'vue'
import { injectDataTableContext } from './context'

const props = withDefaults(
  defineProps<{
    rowKey: string
    disabled?: boolean
  }>(),
  { disabled: false },
)

const { isSelected, toggleRow, selectRange } = injectDataTableContext()

const selected = computed(() => isSelected(props.rowKey))

function onClick(event: MouseEvent) {
  if (props.disabled) return
  if (event.shiftKey) return selectRange(props.rowKey)
  toggleRow(props.rowKey)
}
</script>

<template>
  <input
    type="checkbox"
    :checked="selected"
    :disabled="disabled"
    :data-state="selected ? 'checked' : 'unchecked'"
    @click="onClick"
  />
</template>
