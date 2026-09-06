<script setup lang="ts">
/**
 * The month grid.
 *
 * A real `<table role="grid">`: a screen reader reads the column header with
 * each cell, so "Tuesday 14" comes out of the markup rather than out of an
 * `aria-label` we would have to build and translate ourselves.
 *
 * All the keyboard handling lives here rather than on each cell — one listener
 * that reads the focused date, instead of thirty-one that each know their own.
 */
import { nextTick, ref, watch } from 'vue'
import { injectDatePickerContext } from './context'
import { addDays, addMonths, startOfDay } from '../shared/date'

const { focusedDate, weeks, disabled, select, moveFocus, shiftMonth } =
  injectDatePickerContext()

const el = ref<HTMLElement | null>(null)

/** Moves DOM focus to whichever cell the roving tab stop is on. */
async function focusCell() {
  await nextTick()
  el.value?.querySelector<HTMLElement>('[tabindex="0"]')?.focus()
}

// Only when the grid already holds focus: moving the month with the header
// buttons must not yank focus out of the button that was just clicked.
watch(focusedDate, () => {
  if (el.value?.contains(document.activeElement)) void focusCell()
})

function onKeydown(event: KeyboardEvent) {
  if (disabled.value) return
  const from = focusedDate.value

  switch (event.key) {
    case 'ArrowLeft':
      event.preventDefault()
      return moveFocus(addDays(from, -1))
    case 'ArrowRight':
      event.preventDefault()
      return moveFocus(addDays(from, 1))
    case 'ArrowUp':
      event.preventDefault()
      return moveFocus(addDays(from, -7))
    case 'ArrowDown':
      event.preventDefault()
      return moveFocus(addDays(from, 7))
    case 'Home':
      event.preventDefault()
      // Start of the displayed week, not of the month: Home in a grid means
      // the start of the row.
      return moveFocus(addDays(from, -((from.getDay() + 6) % 7)))
    case 'End':
      event.preventDefault()
      return moveFocus(addDays(from, 6 - ((from.getDay() + 6) % 7)))
    case 'PageUp':
      event.preventDefault()
      return moveFocus(addMonths(from, event.shiftKey ? -12 : -1))
    case 'PageDown':
      event.preventDefault()
      return moveFocus(addMonths(from, event.shiftKey ? 12 : 1))
    case 'Enter':
    case ' ':
      event.preventDefault()
      return select(startOfDay(from))
  }
}

defineExpose({ focusCell, shiftMonth })
</script>

<template>
  <table
    ref="el"
    role="grid"
    :data-disabled="disabled ? '' : undefined"
    @keydown="onKeydown"
  >
    <slot :weeks="weeks" />
  </table>
</template>
