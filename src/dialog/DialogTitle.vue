<script setup lang="ts">
/**
 * The dialog's heading, and the thing a screen reader announces when it opens.
 *
 * Rendering it is what wires `aria-labelledby` on the content — the title tells
 * the root it exists rather than the root guessing, because a title behind a
 * `v-if` is absent for the user exactly when it is absent from the DOM.
 */
import { onBeforeUnmount, onMounted } from 'vue'
import { injectDialogContext } from './context'

const { titleId, hasTitle } = injectDialogContext()

onMounted(() => (hasTitle.value = true))
onBeforeUnmount(() => (hasTitle.value = false))
</script>

<template>
  <h2 :id="titleId">
    <slot />
  </h2>
</template>
