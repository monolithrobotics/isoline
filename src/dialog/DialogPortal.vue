<script setup lang="ts">
/**
 * Moves the dialog out to the end of `<body>`.
 *
 * Without this a dialog inherits every `overflow: hidden`, `transform` and
 * `z-index` between it and the root — the reason a modal renders clipped
 * inside a scrolling panel, or behind a header, no matter what z-index it is
 * given. A transformed ancestor also re-anchors `position: fixed`, so even
 * full-screen centring quietly stops working.
 */
withDefaults(
  defineProps<{
    /** Where to render. Anything Vue's `<Teleport to>` accepts. */
    to?: string | HTMLElement
    /** Render in place instead. For tests, and for rendering to a string. */
    disabled?: boolean
  }>(),
  { to: 'body', disabled: false },
)
</script>

<template>
  <Teleport :to="to" :disabled="disabled">
    <slot />
  </Teleport>
</template>
