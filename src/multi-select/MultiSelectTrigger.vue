<script setup lang="ts">
/**
 * The button that opens the list and keeps focus the whole time.
 *
 * Its content is yours — only you know how several chosen values should read:
 * a count, a list of chips, the first two and "+3".
 */
import { computed, type ComponentPublicInstance } from 'vue'
import { injectMultiSelectContext } from './context'
import { injectListboxPopupContext } from '../shared/popup'

const {
  value,
  open,
  disabled,
  activeId,
  toggle,
  items,
  moveHighlight,
  typeahead,
  setOpen,
  openWith,
} = injectMultiSelectContext()
const { triggerId, contentId, triggerEl } = injectListboxPopupContext()

function isTypeaheadKey(event: KeyboardEvent) {
  return event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey
}

function onKeydown(event: KeyboardEvent) {
  if (disabled.value) return

  if (!open.value) {
    switch (event.key) {
      case 'Enter':
      case ' ':
      case 'ArrowDown':
        event.preventDefault()
        return openWith({ kind: 'first' })
      case 'ArrowUp':
        event.preventDefault()
        return openWith({ kind: 'last' })
    }
    if (isTypeaheadKey(event)) {
      event.preventDefault()
      openWith({ kind: 'typeahead', char: event.key })
    }
    return
  }

  switch (event.key) {
    case 'ArrowDown':
      event.preventDefault()
      return moveHighlight(1)
    case 'ArrowUp':
      event.preventDefault()
      return moveHighlight(-1)
    case 'Home':
      event.preventDefault()
      return moveHighlight('first')
    case 'End':
      event.preventDefault()
      return moveHighlight('last')
    case 'Enter':
    case ' ': {
      event.preventDefault()
      // Toggles and stays open, unlike a single-choice list where the press
      // is the whole answer.
      const active = items().find((item) => item.id === activeId.value)
      if (active && !active.disabled) toggle(active.value)
      return
    }
    case 'Escape':
      event.preventDefault()
      return setOpen(false)
    case 'Tab':
      return setOpen(false)
  }

  if (isTypeaheadKey(event)) {
    event.preventDefault()
    typeahead(event.key)
  }
}

function setTriggerRef(el: Element | ComponentPublicInstance | null) {
  triggerEl.value = el as HTMLElement | null
}

const activeDescendant = computed(() => (open.value ? activeId.value : undefined))
</script>

<template>
  <button
    :id="triggerId"
    :ref="setTriggerRef"
    type="button"
    role="combobox"
    :aria-expanded="open"
    :aria-controls="open ? contentId : undefined"
    :aria-activedescendant="activeDescendant"
    :disabled="disabled"
    :data-state="open ? 'open' : 'closed'"
    :data-disabled="disabled ? '' : undefined"
    @click="open ? setOpen(false) : openWith({ kind: 'first' })"
    @keydown="onKeydown"
  >
    <slot :value="value" :open="open" />
  </button>
</template>
