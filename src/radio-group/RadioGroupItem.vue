<script setup lang="ts">
/**
 * One option inside a `<RadioGroupRoot>`, rendered as `<button role="radio">`.
 *
 * Carries the group's roving tab stop: exactly one item is reachable with Tab
 * — the selected one, or the first enabled item while nothing is selected —
 * and the arrows move between the rest.
 */
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { injectRadioGroupContext, provideRadioGroupItemContext } from './context'

const props = withDefaults(
  defineProps<{
    /** The value this item selects. Required, and unique within the group. */
    value: string
    /** Rejects interaction for this item only. */
    disabled?: boolean
  }>(),
  { disabled: false },
)

const group = injectRadioGroupContext()
const el = ref<HTMLButtonElement | null>(null)

const checked = computed(() => group.value.value === props.value)
const disabled = computed(() => props.disabled || group.disabled.value)

provideRadioGroupItemContext({ checked, disabled })

onMounted(() => el.value && group.register(el.value))
onBeforeUnmount(() => el.value && group.unregister(el.value))

/**
 * Whether Tab lands here. The selected item owns the tab stop; with nothing
 * selected it falls to the first enabled item, so the group is never a hole
 * the keyboard skips over entirely.
 */
const tabbable = computed(() => {
  if (disabled.value) return false
  if (group.value.value !== undefined) return checked.value
  const enabled = group.items().filter((item) => !(item as HTMLButtonElement).disabled)
  return enabled.length > 0 && enabled[0] === el.value
})

function enabledItems() {
  return group.items().filter((item) => !(item as HTMLButtonElement).disabled)
}

/** Moves focus by `step` and selects on arrival — native radio behaviour. */
function move(step: number) {
  const enabled = enabledItems()
  const index = enabled.indexOf(el.value as HTMLElement)
  if (index === -1) return

  let next = index + step
  if (next < 0 || next >= enabled.length) {
    if (!group.loop.value) return
    next = (next + enabled.length) % enabled.length
  }

  const target = enabled[next] as HTMLButtonElement
  target.focus()
  // Click rather than reaching for the target's value: the item's own handler
  // already knows what it selects, and duplicating that here would mean
  // keeping a value attribute in sync purely for our benefit.
  target.click()
}

function onKeydown(event: KeyboardEvent) {
  if (disabled.value) return

  // Both arrow pairs navigate whatever the orientation, as native radios do.
  // A user who cannot see the layout should not have to guess which pair the
  // author had in mind.
  switch (event.key) {
    case 'ArrowDown':
    case 'ArrowRight':
      event.preventDefault()
      move(1)
      break
    case 'ArrowUp':
    case 'ArrowLeft':
      event.preventDefault()
      move(-1)
      break
  }
}

function onClick() {
  if (disabled.value) return
  group.select(props.value)
}
</script>

<template>
  <button
    ref="el"
    type="button"
    role="radio"
    :aria-checked="checked"
    :disabled="disabled"
    :tabindex="tabbable ? 0 : -1"
    :value="value"
    :data-state="checked ? 'checked' : 'unchecked'"
    :data-disabled="disabled ? '' : undefined"
    @click="onClick"
    @keydown="onKeydown"
  >
    <slot :checked="checked" :disabled="disabled" />
  </button>
</template>
