<script setup lang="ts">
/**
 * A button that closes the dialog — the visible one in a footer, or the ✕ in
 * a corner.
 *
 * Nothing more than `@click="close"`, and it exists so that closing is spelled
 * the same way everywhere and a consumer never has to reach for the open state
 * from inside the panel.
 */
import { injectDialogContext } from './context'

const { close } = injectDialogContext()
</script>

<template>
  <button type="button" @click="close">
    <slot />
  </button>
</template>
