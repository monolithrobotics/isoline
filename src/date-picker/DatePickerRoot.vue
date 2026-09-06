<script setup lang="ts">
/**
 * A calendar for choosing one day.
 *
 * The grid is a roving tab stop: Tab lands on one cell — the selection, today,
 * or the first day of the month — and the arrows move within it. Thirty-one tab
 * stops per month is not navigation, it is an obstacle.
 *
 * Dates are plain local-time `Date`s at midnight. No timezone handling and no
 * UTC: the user is picking a day off the wall calendar in front of them, and
 * converting to UTC is what puts "1 March" in February west of Greenwich.
 */
import { computed, ref, watch } from 'vue'
import { provideDatePickerContext, type DatePickerDay } from './context'
import {
  addMonths,
  isSameDay,
  isSameMonth,
  monthGrid,
  startOfDay,
  startOfMonth,
} from '../shared/date'

const props = withDefaults(
  defineProps<{
    /** The chosen day. Use with `v-model`. */
    modelValue?: Date
    /** Earliest selectable day, inclusive. */
    min?: Date
    /** Latest selectable day, inclusive. */
    max?: Date
    /** Rejects a specific day — weekends, blackout dates, days already booked. */
    isDateDisabled?: (date: Date) => boolean
    /** 0 for Sunday through 6 for Saturday. Defaults to Monday. */
    weekStartsOn?: number
    /** Rejects the whole calendar. */
    disabled?: boolean
  }>(),
  {
    modelValue: undefined,
    min: undefined,
    max: undefined,
    isDateDisabled: undefined,
    weekStartsOn: 1,
    disabled: false,
  },
)

const emit = defineEmits<{
  'update:modelValue': [value: Date]
}>()

const value = computed(() => props.modelValue)
const disabled = computed(() => props.disabled)

const today = startOfDay(new Date())

const viewMonth = ref(startOfMonth(props.modelValue ?? today))
const focusedDate = ref(startOfDay(props.modelValue ?? today))

// A value set from outside — a form reset, a preset button — has to bring the
// view with it, or the calendar shows a month that no longer contains the
// selection.
watch(value, (next) => {
  if (!next) return
  focusedDate.value = startOfDay(next)
  if (!isSameMonth(next, viewMonth.value)) viewMonth.value = startOfMonth(next)
})

function isDisabled(date: Date): boolean {
  if (props.disabled) return true
  if (props.min && date < startOfDay(props.min)) return true
  if (props.max && date > startOfDay(props.max)) return true
  return props.isDateDisabled?.(date) ?? false
}

const weeks = computed<DatePickerDay[][]>(() =>
  monthGrid(viewMonth.value, props.weekStartsOn).map((week) =>
    week.map((date) => ({
      date,
      inMonth: isSameMonth(date, viewMonth.value),
      selected: isSameDay(date, value.value),
      today: isSameDay(date, today),
      disabled: isDisabled(date),
    })),
  ),
)

function select(date: Date) {
  if (isDisabled(date)) return
  emit('update:modelValue', startOfDay(date))
}

function moveFocus(to: Date) {
  const next = startOfDay(to)
  focusedDate.value = next
  // Arrowing off the edge of a month pages the view, the way it does in every
  // native date field — otherwise the focused day is off screen.
  if (!isSameMonth(next, viewMonth.value)) viewMonth.value = startOfMonth(next)
}

function shiftMonth(months: number) {
  viewMonth.value = startOfMonth(addMonths(viewMonth.value, months))
}

provideDatePickerContext({
  value,
  viewMonth: computed(() => viewMonth.value),
  focusedDate,
  weeks,
  disabled,
  select,
  moveFocus,
  shiftMonth,
  isDisabled,
})
</script>

<template>
  <slot :value="value" :view-month="viewMonth" :weeks="weeks" />
</template>
