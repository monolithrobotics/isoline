<script setup lang="ts">
/**
 * One option in the list.
 *
 * Highlights on hover as well as on arrow keys, so the mouse and the keyboard
 * agree on what Enter would pick. Selection happens on `pointerup`, not
 * `click`: a press that starts on the trigger and ends on the option — the
 * press-drag-release a native select invites — would otherwise select nothing.
 */
import { computed, onBeforeUnmount, onMounted, ref, useId } from 'vue'
import { injectSelectContext } from './context'
import { provideSelectItemContext } from './itemContext'

const props = withDefaults(
  defineProps<{
    /** The value this option selects. Required, and unique within the list. */
    value: string
    /** Rejects interaction for this option only. */
    disabled?: boolean
    /**
     * What typeahead matches against. Defaults to the rendered text, which is
     * right until the option renders an icon or a badge alongside its label.
     */
    textValue?: string
  }>(),
  { disabled: false, textValue: undefined },
)

const select = injectSelectContext()
const id = useId()
const el = ref<HTMLElement | null>(null)

const selected = computed(() => select.value.value === props.value)
const highlighted = computed(() => select.activeId.value === id)

provideSelectItemContext({
  selected,
  highlighted,
  disabled: computed(() => props.disabled),
})

onMounted(() => {
  if (!el.value) return
  select.register({
    id,
    value: props.value,
    textValue: props.textValue ?? el.value.textContent?.trim() ?? '',
    disabled: props.disabled,
    el: el.value,
  })
})

onBeforeUnmount(() => {
  select.unregister(id)
  // Leaving the highlight on an option that no longer exists points
  // `aria-activedescendant` at a missing id, which screen readers report as
  // nothing at all.
  if (highlighted.value) select.highlight(undefined)
})

function onPointerup() {
  if (props.disabled) return
  select.select(props.value)
}

function onPointermove() {
  if (props.disabled || highlighted.value) return
  select.highlight(id)
}
</script>

<template>
  <div
    :id="id"
    ref="el"
    role="option"
    :aria-selected="selected"
    :aria-disabled="disabled || undefined"
    :data-state="selected ? 'checked' : 'unchecked'"
    :data-highlighted="highlighted ? '' : undefined"
    :data-disabled="disabled ? '' : undefined"
    @pointerup="onPointerup"
    @pointermove="onPointermove"
  >
    <slot :selected="selected" :highlighted="highlighted" />
  </div>
</template>
