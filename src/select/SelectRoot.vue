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
import { provideSelectContext, type SelectItemRecord } from './context'
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
const value = computed(() => props.modelValue)
const open = computed(() => props.open)
const disabled = computed(() => props.disabled)

const activeId = ref<string | undefined>(undefined)
const triggerEl = ref<HTMLElement | null>(null)

// Options are tracked by record rather than by index: `v-for` with a `v-if`
// inside gives no stable index, and the order that matters for the arrows is
// the order on screen.
const registered = ref<SelectItemRecord[]>([])

function register(item: SelectItemRecord) {
  registered.value = [...registered.value, item]
}

function unregister(itemId: string) {
  registered.value = registered.value.filter((item) => item.id !== itemId)
}

function items() {
  return [...registered.value].sort((a, b) =>
    a.el.compareDocumentPosition(b.el) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1,
  )
}

const enabledItems = () => items().filter((item) => !item.disabled)

function setOpen(next: boolean) {
  if (props.disabled || next === props.open) return
  emit('update:open', next)
}

function select(next: string) {
  if (props.disabled) return
  if (next !== props.modelValue) emit('update:modelValue', next)
  setOpen(false)
}

function highlight(next: string | undefined) {
  activeId.value = next
  if (!next) return
  const item = registered.value.find((candidate) => candidate.id === next)
  // Guarded because jsdom has no `scrollIntoView`, and a consumer's test suite
  // should not fail on a line that only exists to keep a real list scrolled.
  // `nearest` so opening a list whose selection is already visible does not
  // jerk it to the middle of the viewport.
  if (typeof item?.el.scrollIntoView === 'function') {
    item.el.scrollIntoView({ block: 'nearest' })
  }
}

function moveHighlight(to: number | 'first' | 'last') {
  const enabled = enabledItems()
  if (enabled.length === 0) return

  if (to === 'first') return highlight(enabled[0]!.id)
  if (to === 'last') return highlight(enabled[enabled.length - 1]!.id)

  const current = enabled.findIndex((item) => item.id === activeId.value)
  // With nothing highlighted, the first press lands on an end rather than
  // stepping off an imaginary position in the middle.
  if (current === -1)
    return highlight((to > 0 ? enabled[0] : enabled[enabled.length - 1])!.id)

  const next = Math.min(Math.max(0, current + to), enabled.length - 1)
  highlight(enabled[next]!.id)
}

let buffer = ''
let bufferedAt = 0

function typeahead(char: string) {
  const now = Date.now()
  // A pause resets the search. Without it, coming back to a list an hour later
  // and typing "b" would search for whatever was typed before it.
  buffer = now - bufferedAt > 500 ? char : buffer + char
  bufferedAt = now

  const enabled = enabledItems()

  // Repeating one letter walks through the items starting with it, rather than
  // searching for "aaa" and finding nothing — which is what native selects do,
  // and the only way to reach the second "Apricot" in a list of them.
  const repeated = buffer.length > 1 && [...buffer].every((char2) => char2 === buffer[0])
  const query = (repeated ? buffer[0]! : buffer).toLowerCase()
  const cycling = repeated || buffer.length === 1

  // Cycling starts after the current item so a press always moves on.
  const start = enabled.findIndex((item) => item.id === activeId.value) + 1
  const ordered = cycling
    ? [...enabled.slice(start), ...enabled.slice(0, start)]
    : enabled

  const match = ordered.find((item) => item.textValue.toLowerCase().startsWith(query))
  if (match) highlight(match.id)
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

provideSelectContext({
  value,
  open,
  disabled,
  triggerId: `${id}-trigger`,
  contentId: `${id}-content`,
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
