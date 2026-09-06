<script setup lang="ts">
/**
 * A single-choice list with a popup, following the ARIA combobox pattern.
 *
 * Focus never leaves the trigger. The highlighted option is announced through
 * `aria-activedescendant` instead of being focused, which keeps the tab order
 * of the page intact and removes every way focus can be lost while the list
 * opens, closes and re-renders under it.
 *
 * There is no `SelectValue` part: the library does not know your labels, and a
 * part that guessed them would be wrong until the list had been opened once.
 * Render the label in the trigger yourself, where it is always right:
 *
 * ```vue
 * <SelectTrigger>{{ options.find((o) => o.value === model)?.label ?? 'Pick one' }}</SelectTrigger>
 * ```
 */
import { computed, nextTick, ref, useId, watch } from 'vue'
import { provideSelectContext } from './context'
import { createListbox } from '../shared/listbox'
import { provideListboxPopupContext } from '../shared/popup'
import { VISUALLY_HIDDEN } from '../shared/visuallyHidden'

const props = withDefaults(
  defineProps<{
    /** The selected value. Use with `v-model`. */
    modelValue?: string
    /** Whether the list is showing. Use with `v-model:open`. */
    open?: boolean
    /** Rejects interaction, and greys out for a11y tools. */
    disabled?: boolean
    /** Name for the mirrored hidden control. Omit outside a form. */
    name?: string
    /** Marks the mirrored control required, for native form validation. */
    required?: boolean
  }>(),
  {
    modelValue: undefined,
    open: false,
    disabled: false,
    name: undefined,
    required: false,
  },
)

const emit = defineEmits<{
  'update:modelValue': [value: string]
  'update:open': [open: boolean]
}>()

const id = useId()
const triggerId = `${id}-trigger`
const contentId = `${id}-content`
const value = computed(() => props.modelValue)
const open = computed(() => props.open)
const disabled = computed(() => props.disabled)

const triggerEl = ref<HTMLElement | null>(null)

// Registration, ordering, the highlight and typeahead are the same for any
// popup list, so they live in `shared/listbox` where the single- and
// multi-choice versions cannot drift apart.
const { activeId, register, unregister, items, highlight, moveHighlight, typeahead } =
  createListbox()

function setOpen(next: boolean) {
  if (props.disabled || next === props.open) return
  emit('update:open', next)
}

function select(next: string) {
  if (props.disabled) return
  if (next !== props.modelValue) emit('update:modelValue', next)
  setOpen(false)
}

/**
 * What the highlight should do once the list is actually on screen.
 *
 * Options only exist while the list is open, so nothing can be highlighted at
 * the moment the trigger asks for it — the intent is recorded here and applied
 * a tick later, once the options have registered themselves.
 */
type OpenIntent =
  { kind: 'first' } | { kind: 'last' } | { kind: 'typeahead'; char: string }

let pending: OpenIntent | null = null

function openWith(intent: OpenIntent) {
  pending = intent
  setOpen(true)
}

watch(
  open,
  async (isOpen) => {
    if (!isOpen) {
      // A highlight left behind would be announced the next time the list
      // opens, before the user has pressed anything.
      activeId.value = undefined
      pending = null
      return
    }

    await nextTick()
    const intent = pending ?? { kind: 'first' }
    pending = null

    if (intent.kind === 'typeahead') return typeahead(intent.char)

    // Opening always starts at the selection when there is one, whichever end
    // the key implied — that is what a native select does.
    const selected = items().find((item) => item.value === value.value && !item.disabled)
    if (selected) return highlight(selected.id)
    moveHighlight(intent.kind === 'last' ? 'last' : 'first')
  },
  { immediate: true, flush: 'post' },
)

provideListboxPopupContext({
  open,
  multiselectable: false,
  triggerId,
  contentId,
  triggerEl,
  setOpen,
})

provideSelectContext({
  value,
  open,
  disabled,
  triggerId,
  contentId,
  activeId,
  triggerEl,
  setOpen,
  openWith,
  select,
  register,
  unregister,
  items,
  highlight,
  moveHighlight,
  typeahead,
})
</script>

<template>
  <slot :value="value" :open="open" />

  <!--
    Mirrors the selection for native form submission, and stays a real
    `<select>` so `required` still fails validation while nothing is chosen —
    a hidden input is never validated.
  -->
  <select
    v-if="name"
    tabindex="-1"
    aria-hidden="true"
    :name="name"
    :disabled="disabled"
    :required="required"
    :value="value ?? ''"
    :style="VISUALLY_HIDDEN"
  >
    <option value="" />
    <option v-if="value !== undefined" :value="value" />
  </select>
</template>
