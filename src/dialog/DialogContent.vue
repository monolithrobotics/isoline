<script setup lang="ts">
/**
 * The dialog panel: the part that traps focus, listens for Escape, and gives
 * focus back when it goes away.
 *
 * Rendered only while open. A closed dialog left in the DOM is still read by
 * screen readers and still tab-stopped unless every part of it is hidden by
 * hand, and getting that wrong is invisible to a sighted author.
 */
import { computed, nextTick, onBeforeUnmount, ref, useAttrs, watch } from 'vue'
import { injectDialogContext } from './context'
import { getFocusable } from '../shared/focus'
import { lockScroll, unlockScroll } from '../shared/scrollLock'
import { isTopmostDialog, pushDialog, removeDialog } from './stack'

const props = withDefaults(
  defineProps<{
    /** Whether Escape closes the dialog. */
    closeOnEscape?: boolean
  }>(),
  { closeOnEscape: true },
)

const attrs = useAttrs()
const {
  open,
  modal,
  close,
  contentId,
  titleId,
  descriptionId,
  hasTitle,
  hasDescription,
} = injectDialogContext()

const el = ref<HTMLElement | null>(null)

function onKeydown(event: KeyboardEvent) {
  if (!el.value || !isTopmostDialog(el.value)) return

  if (event.key === 'Escape' && props.closeOnEscape) {
    event.preventDefault()
    close()
    return
  }

  if (event.key !== 'Tab' || !modal.value) return

  const focusable = getFocusable(el.value)
  if (focusable.length === 0) {
    // Nothing to move to, so Tab must not leave either — a modal that lets
    // focus wander onto the page behind it is not modal.
    event.preventDefault()
    return
  }

  const first = focusable[0] as HTMLElement
  const last = focusable[focusable.length - 1] as HTMLElement
  const active = document.activeElement

  if (event.shiftKey && (active === first || active === el.value)) {
    event.preventDefault()
    last.focus()
  } else if (!event.shiftKey && active === last) {
    event.preventDefault()
    first.focus()
  }
}

let previouslyFocused: HTMLElement | null = null
let listening = false

/**
 * Everything the panel does to the rest of the page while it is up.
 *
 * Driven by `open` rather than by mount, because this component stays mounted
 * across the whole open/close cycle — only its element comes and goes. Hanging
 * the scroll lock on `onMounted` would lock the page the moment the dialog was
 * declared, and never unlock it.
 */
async function activate() {
  if (!el.value) return

  // Where focus came from, rather than which trigger was clicked: a dialog
  // opened from a menu item, a keyboard shortcut or a watcher has no trigger,
  // and dumping focus back on `<body>` loses the user's place entirely.
  previouslyFocused = document.activeElement as HTMLElement | null

  pushDialog(el.value)
  if (modal.value) lockScroll()
  document.addEventListener('keydown', onKeydown)
  listening = true

  await nextTick()
  if (!el.value) return

  const focusable = getFocusable(el.value)
  // The panel itself is the fallback, which is why it carries `tabindex="-1"`:
  // a dialog with nothing focusable inside still has to receive focus, or the
  // screen reader keeps reading the page behind it.
  ;(focusable[0] ?? el.value).focus()

  if (!hasTitle.value && !attrs['aria-label'] && !attrs['aria-labelledby']) {
    console.warn(
      '[isoline] <DialogContent> has no accessible name. Render a <DialogTitle> ' +
        'inside it, or pass aria-label, so it is announced as more than "dialog".',
    )
  }
}

function deactivate(panel: HTMLElement | null) {
  if (!listening) return
  listening = false

  document.removeEventListener('keydown', onKeydown)
  if (panel) removeDialog(panel)
  if (modal.value) unlockScroll()

  // `isConnected` because the trigger may have been removed by the same change
  // that closed the dialog; focusing a detached node silently focuses `<body>`.
  if (previouslyFocused?.isConnected) previouslyFocused.focus()
  previouslyFocused = null
}

// `flush: 'post'` so the element exists to focus by the time this runs, and
// the closing pass still sees it before Vue detaches it.
watch(
  open,
  (isOpen, _was, onCleanup) => {
    if (!isOpen) return
    const panel = el.value
    void activate()
    onCleanup(() => deactivate(panel))
  },
  { immediate: true, flush: 'post' },
)

onBeforeUnmount(() => deactivate(el.value))

const labelledBy = computed(() => (hasTitle.value ? titleId : undefined))
const describedBy = computed(() => (hasDescription.value ? descriptionId : undefined))
</script>

<template>
  <div
    v-if="open"
    :id="contentId"
    ref="el"
    role="dialog"
    tabindex="-1"
    :aria-modal="modal ? 'true' : undefined"
    :aria-labelledby="labelledBy"
    :aria-describedby="describedBy"
    data-state="open"
  >
    <slot />
  </div>
</template>
