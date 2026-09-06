<script setup lang="ts">
/**
 * The input, masked or not.
 *
 * `autocomplete` is required rather than defaulted: a sign-in field and a
 * change-password field need different values (`current-password` and
 * `new-password`), and guessing wrong makes password managers fill or save the
 * wrong thing — which users notice long after the fact.
 */
import { injectPasswordFieldContext } from './context'

defineProps<{
  /** `current-password` when signing in, `new-password` when setting one. */
  autocomplete: 'current-password' | 'new-password' | 'off'
}>()

const model = defineModel<string>({ default: '' })
const { visible, inputId, setCapsLock } = injectPasswordFieldContext()

function readCapsLock(event: KeyboardEvent) {
  // `getModifierState` is the only way to know: there is no Caps Lock key
  // event, only its effect on the keys that follow.
  setCapsLock(event.getModifierState?.('CapsLock') ?? false)
}
</script>

<template>
  <input
    :id="inputId"
    v-model="model"
    :type="visible ? 'text' : 'password'"
    :autocomplete="autocomplete"
    :data-state="visible ? 'visible' : 'masked'"
    @keydown="readCapsLock"
    @keyup="readCapsLock"
    @blur="setCapsLock(false)"
  />
</template>
