<script setup lang="ts">
/**
 * The supporting line under the title, wired to the content's
 * `aria-describedby`.
 *
 * Optional, and worth omitting when there is nothing to add: a description
 * that repeats the title makes every screen-reader announcement twice as long
 * for no extra information.
 */
import { onBeforeUnmount, onMounted } from 'vue'
import { injectDialogContext } from './context'

const { descriptionId, hasDescription } = injectDialogContext()

onMounted(() => (hasDescription.value = true))
onBeforeUnmount(() => (hasDescription.value = false))
</script>

<template>
  <p :id="descriptionId">
    <slot />
  </p>
</template>
