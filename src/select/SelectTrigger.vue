<script setup lang="ts">
/**
 * The button that opens the list and keeps focus the whole time.
 *
 * Its content is yours: render the selected option's label here, since only
 * you know what a value should read as.
 */
import { computed, type ComponentPublicInstance } from 'vue'
import { injectSelectContext } from './context'

const {
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
  items,
  moveHighlight,
  typeahead,
} = injectSelectContext()

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
    // Typing on a closed select opens it and searches. A native select can
    // pick without opening because the browser holds the options; here they
    // are unmounted until the list is on screen, so there is nothing to
    // search — and silently doing nothing would be the worse answer.
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
      const active = items().find((item) => item.id === activeId.value)
      if (active) select(active.value)
      return
    }
    case 'Escape':
      event.preventDefault()
      // Focus is already here and never left, so there is nothing to restore.
      return setOpen(false)
    case 'Tab':
      // Not prevented: Tab closes the list and moves on, rather than trapping
      // someone inside a control they are trying to leave.
      return setOpen(false)
  }

  if (isTypeaheadKey(event)) {
    event.preventDefault()
    typeahead(event.key)
  }
}

function isTypeaheadKey(event: KeyboardEvent) {
  return event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey
}

/**
 * The root owns the trigger element so the popup can measure against it. A
 * function ref rather than `ref="triggerEl"`, because the binding comes from
 * the context and the string form would look unused to the type checker.
 */
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
