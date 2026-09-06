<script setup lang="ts">
/**
 * A password input that can be unmasked, and that says when Caps Lock is on.
 *
 * Both exist for the same reason: a field nobody can read is a field people
 * mistype, and the two commonest causes of "my password is wrong" are a typo
 * they could not see and a Caps Lock they did not notice.
 */
import { computed, ref, useId } from 'vue'
import { providePasswordFieldContext } from './context'

const props = withDefaults(
  defineProps<{
    /** Whether the characters are readable. Use with `v-model:visible`. */
    visible?: boolean
  }>(),
  { visible: false },
)

const emit = defineEmits<{
  'update:visible': [visible: boolean]
}>()

const visible = computed(() => props.visible)
const capsLock = ref(false)
const inputId = `${useId()}-input`

providePasswordFieldContext({
  visible,
  capsLock: computed(() => capsLock.value),
  toggleVisibility: () => emit('update:visible', !props.visible),
  setCapsLock: (on: boolean) => (capsLock.value = on),
  inputId,
})
</script>

<template>
  <slot :visible="visible" :caps-lock="capsLock" />
</template>
