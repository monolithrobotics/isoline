<script setup lang="ts">
/**
 * A label that appears on hover or focus and describes its trigger.
 *
 * A tooltip is not a popover: it holds no focus, no controls and no text worth
 * selecting, so nothing here traps or moves focus. If what you need contains a
 * link or a button, it is a popover, and a tooltip that pretends otherwise
 * leaves the contents unreachable by keyboard.
 *
 * ```vue
 * <TooltipRoot>
 *   <TooltipTrigger><button>Arm</button></TooltipTrigger>
 *   <TooltipPortal>
 *     <TooltipContent class="tip">Hold to arm the vehicle</TooltipContent>
 *   </TooltipPortal>
 * </TooltipRoot>
 * ```
 */
import { computed, onBeforeUnmount, ref, useId } from 'vue'
import { provideTooltipContext } from './context'

const props = withDefaults(
  defineProps<{
    /** Whether it is showing. Use with `v-model:open` to drive it yourself. */
    open?: boolean
    /** How long a pointer must rest on the trigger, in milliseconds. */
    delay?: number
    /** Whether it can open at all. */
    disabled?: boolean
  }>(),
  { open: false, delay: 700, disabled: false },
)

const emit = defineEmits<{
  'update:open': [open: boolean]
}>()

const open = computed(() => props.open)
const triggerEl = ref<HTMLElement | null>(null)
const contentId = `${useId()}-content`

let timer: ReturnType<typeof setTimeout> | undefined

function clear() {
  if (timer !== undefined) clearTimeout(timer)
  timer = undefined
}

function openNow() {
  clear()
  if (props.disabled || props.open) return
  emit('update:open', true)
}

function openAfterDelay() {
  clear()
  if (props.disabled || props.open) return
  // A pointer crossing a toolbar passes over a dozen triggers; opening on
  // arrival would flash a tooltip for each one.
  timer = setTimeout(() => emit('update:open', true), props.delay)
}

function close() {
  clear()
  if (props.open) emit('update:open', false)
}

// A trigger unmounted mid-delay — a row deleted, a route changed — would
// otherwise open a tooltip for something that is no longer there.
onBeforeUnmount(clear)

provideTooltipContext({ open, contentId, triggerEl, openAfterDelay, openNow, close })
</script>

<template>
  <slot :open="open" />
</template>
