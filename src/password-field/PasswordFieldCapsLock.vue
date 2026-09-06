<script setup lang="ts">
/**
 * A warning shown while Caps Lock is on.
 *
 * `role="status"` so it is announced when it appears without stealing focus —
 * an alert would interrupt, and the user is mid-password.
 */
import { injectPasswordFieldContext } from './context'

const { capsLock } = injectPasswordFieldContext()
</script>

<template>
  <span v-if="capsLock" role="status" data-state="on">
    <slot />
  </span>
</template>
