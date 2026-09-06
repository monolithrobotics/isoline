<script setup lang="ts">
/**
 * One option in a multi-choice list.
 *
 * Toggles on `pointerup` and leaves the list open, so a run of choices is a
 * run of clicks.
 */
import { computed, onBeforeUnmount, onMounted, ref, useId } from 'vue'
import { injectMultiSelectContext, provideMultiSelectItemContext } from './context'

const props = withDefaults(
  defineProps<{
    /** The value this option adds or removes. Unique within the list. */
    value: string
    /** Rejects interaction for this option only. */
    disabled?: boolean
    /** What typeahead matches against. Defaults to the rendered text. */
    textValue?: string
  }>(),
  { disabled: false, textValue: undefined },
)

const list = injectMultiSelectContext()
const id = useId()
const el = ref<HTMLElement | null>(null)

const selected = computed(() => list.value.value.includes(props.value))
const highlighted = computed(() => list.activeId.value === id)

provideMultiSelectItemContext({
  selected,
  highlighted,
  disabled: computed(() => props.disabled),
})

onMounted(() => {
  if (!el.value) return
  list.register({
    id,
    value: props.value,
    textValue: props.textValue ?? el.value.textContent?.trim() ?? '',
    disabled: props.disabled,
    el: el.value,
  })
})

onBeforeUnmount(() => {
  list.unregister(id)
  // A highlight left on a removed option points `aria-activedescendant` at a
  // missing id, which screen readers report as nothing at all.
  if (highlighted.value) list.highlight(undefined)
})

function onPointerup() {
  if (props.disabled) return
  list.toggle(props.value)
}

function onPointermove() {
  if (props.disabled || highlighted.value) return
  list.highlight(id)
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
