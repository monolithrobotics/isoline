<script setup lang="ts">
/**
 * One day.
 *
 * Carries the grid's single tab stop when it is the focused day — the
 * selection, or today, or the first of the month while nothing is chosen.
 * `aria-selected` rather than `aria-pressed`: inside a grid, a cell is
 * selected, not pressed.
 */
import { computed } from 'vue'
import { injectDatePickerContext, type DatePickerDay } from './context'
import { isSameDay } from '../shared/date'

const props = defineProps<{
  /** One entry from the root's `weeks`. */
  day: DatePickerDay
}>()

const { focusedDate, select, moveFocus } = injectDatePickerContext()

const focused = computed(() => isSameDay(props.day.date, focusedDate.value))

function onClick() {
  if (props.day.disabled) return
  // Move the roving stop first: clicking a day in the trailing week of the
  // previous month should leave the keyboard where the pointer went.
  moveFocus(props.day.date)
  select(props.day.date)
}
</script>

<template>
  <td role="gridcell" :aria-selected="day.selected">
    <button
      type="button"
      :tabindex="focused ? 0 : -1"
      :disabled="day.disabled"
      :aria-current="day.today ? 'date' : undefined"
      :data-state="day.selected ? 'selected' : 'unselected'"
      :data-today="day.today ? '' : undefined"
      :data-outside-month="day.inMonth ? undefined : ''"
      :data-disabled="day.disabled ? '' : undefined"
      @click="onClick"
    >
      <slot :day="day">{{ day.date.getDate() }}</slot>
    </button>
  </td>
</template>
