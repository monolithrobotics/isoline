<script setup lang="ts">
/**
 * Moves a floating element out to the end of `<body>`. Exported as
 * `SelectPortal`, `MultiSelectPortal` and `TooltipPortal` — one component,
 * three names, because a portal has nothing to do with what it carries.
 *
 * Without this a popup inherits every `overflow: hidden`, `transform` and
 * `z-index` between it and the root — the reason a select inside a scrolling
 * panel renders clipped, or behind a header, whatever z-index it is given.
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
