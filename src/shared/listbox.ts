import { ref, type Ref } from 'vue'

export interface ListboxItem {
  id: string
  value: string
  /** What typeahead matches against. */
  textValue: string
  disabled: boolean
  el: HTMLElement
}

/**
 * The parts of a popup list that have nothing to do with what selection means.
 *
 * Registration, document order, the highlight and typeahead are identical
 * whether one option can be chosen or several — only the selection differs.
 * Kept here so the two cannot drift apart: a fix to typeahead that landed in
 * one and not the other would be invisible until someone used the other.
 */
export interface Listbox {
  activeId: Ref<string | undefined>
  register: (item: ListboxItem) => void
  unregister: (id: string) => void
  /** Registered options in document order, disabled ones included. */
  items: () => ListboxItem[]
  highlight: (id: string | undefined) => void
  /** Move the highlight by a step, or to an end of the list. */
  moveHighlight: (to: number | 'first' | 'last') => void
  /** Advance the typeahead buffer and highlight the first match. */
  typeahead: (char: string) => void
}

export function createListbox(): Listbox {
  const registered = ref<ListboxItem[]>([])
  const activeId = ref<string | undefined>(undefined)

  function register(item: ListboxItem) {
    registered.value = [...registered.value, item]
  }

  function unregister(id: string) {
    registered.value = registered.value.filter((item) => item.id !== id)
  }

  function items() {
    return [...registered.value].sort((a, b) =>
      a.el.compareDocumentPosition(b.el) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1,
    )
  }

  const enabledItems = () => items().filter((item) => !item.disabled)

  function highlight(next: string | undefined) {
    activeId.value = next
    if (!next) return

    const item = registered.value.find((candidate) => candidate.id === next)
    // Guarded because jsdom has no `scrollIntoView`, and a consumer's test
    // suite should not fail on a line that only exists to keep a real list
    // scrolled. `nearest` so opening a list whose selection is already visible
    // does not jerk it to the middle of the viewport.
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
    // A pause resets the search. Without it, coming back to a list an hour
    // later and typing "b" would search for whatever was typed before it.
    buffer = now - bufferedAt > 500 ? char : buffer + char
    bufferedAt = now

    const enabled = enabledItems()

    // Repeating one letter walks through the items starting with it, rather
    // than searching for "aaa" and finding nothing — which is what native
    // selects do, and the only way to reach the second "Apricot" in a list.
    const repeated =
      buffer.length > 1 && [...buffer].every((char2) => char2 === buffer[0])
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

  return { activeId, register, unregister, items, highlight, moveHighlight, typeahead }
}
