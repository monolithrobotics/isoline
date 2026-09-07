<script setup lang="ts">
/**
 * A list where several options can be chosen at once.
 *
 * The same shell as `Select` — same popup, same keyboard, same typeahead —
 * differing only in what choosing does: it toggles membership and leaves the
 * list open, because someone picking three things should not have to reopen it
 * twice.
 *
 * The value is `readonly string[]`, and the component never mutates it: it
 * emits a new array. A consumer holding the same array elsewhere keeps whatever
 * they had.
 */
import { computed, nextTick, ref, useId, watch } from 'vue'
import { provideMultiSelectContext } from './context'
import { provideListboxPopupContext } from '../shared/popup'
import { createListbox } from '../shared/listbox'
import { VISUALLY_HIDDEN } from '../shared/visuallyHidden'

/**
 * Renders no element of its own — a slot plus the hidden field that mirrors
 * the selection for form submission. There is therefore nothing for Vue to
 * place fallthrough attributes on, and letting it try only produces a dev
 * warning about attributes it then drops. State the intent instead: a `class`
 * belongs on `<MultiSelectTrigger>`, which is the element the consumer can see.
 */
defineOptions({ inheritAttrs: false })

const props = withDefaults(
  defineProps<{
    /** The selected values. Use with `v-model`. */
    modelValue?: readonly string[]
    /** Whether the list is showing. Use with `v-model:open`. */
    open?: boolean
    /** Rejects interaction, and greys out for a11y tools. */
    disabled?: boolean
    /** Name for the mirrored hidden inputs. Omit outside a form. */
    name?: string
  }>(),
  { modelValue: () => [], open: false, disabled: false, name: undefined },
)

const emit = defineEmits<{
  'update:modelValue': [value: string[]]
  'update:open': [open: boolean]
}>()

const id = useId()
const triggerId = `${id}-trigger`
const contentId = `${id}-content`

const value = computed(() => props.modelValue)
const open = computed(() => props.open)
const disabled = computed(() => props.disabled)
const triggerEl = ref<HTMLElement | null>(null)

const { activeId, register, unregister, items, highlight, moveHighlight, typeahead } =
  createListbox()

function setOpen(next: boolean) {
  if (props.disabled || next === props.open) return
  emit('update:open', next)
}

function toggle(next: string) {
  if (props.disabled) return

  const has = props.modelValue.includes(next)
  emit(
    'update:modelValue',
    has ? props.modelValue.filter((item) => item !== next) : [...props.modelValue, next],
  )
  // Deliberately no `setOpen(false)`: the list stays up so the next choice
  // costs one click rather than three.
}

type OpenIntent = { kind: 'first' | 'last' } | { kind: 'typeahead'; char: string }

let pending: OpenIntent | null = null

function openWith(intent: OpenIntent) {
  pending = intent
  setOpen(true)
}

// Options are unmounted while the list is closed, so nothing can be
// highlighted at the moment the trigger asks — the intent is recorded and
// applied a tick later, once the options have registered themselves.
watch(
  open,
  async (isOpen) => {
    if (!isOpen) {
      activeId.value = undefined
      pending = null
      return
    }

    await nextTick()
    const intent = pending ?? { kind: 'first' }
    pending = null

    if (intent.kind === 'typeahead') return typeahead(intent.char)

    // Opening starts at the first selected option when there is one — with
    // several selected, the first is the only one that is not an arbitrary
    // choice on our part.
    const selected = items().find(
      (item) => value.value.includes(item.value) && !item.disabled,
    )
    if (selected) return highlight(selected.id)
    moveHighlight(intent.kind === 'last' ? 'last' : 'first')
  },
  { immediate: true, flush: 'post' },
)

provideListboxPopupContext({
  open,
  multiselectable: true,
  triggerId,
  contentId,
  triggerEl,
  setOpen,
})

provideMultiSelectContext({
  value,
  open,
  disabled,
  activeId,
  toggle,
  register,
  unregister,
  items,
  highlight,
  moveHighlight,
  typeahead,
  setOpen,
  openWith,
})
</script>

<template>
  <slot :value="value" :open="open" />

  <!--
    One hidden input per value, all under the same name — the shape a form
    expects for a repeated field. Not a `<select multiple>`: its selectedness
    is a DOM property rather than an attribute, so it cannot be re-rendered
    reliably from markup. The cost is that `required` cannot be validated
    natively here, which is why this component does not offer it.
  -->
  <template v-if="name">
    <input
      v-for="selected in value"
      :key="selected"
      type="hidden"
      :name="name"
      :value="selected"
      :style="VISUALLY_HIDDEN"
    />
  </template>
</template>
