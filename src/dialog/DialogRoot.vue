<script setup lang="ts">
/**
 * Owns whether a dialog is open, and nothing else — it renders no element of
 * its own, so it can sit anywhere in a tree without disturbing layout.
 *
 * Use `v-model:open` rather than `v-model`: a dialog's parts each take their
 * own model later (a select inside it, a form), and a bare `modelValue` on the
 * container would read as "the dialog's value", which it is not.
 *
 * ```vue
 * <DialogRoot v-model:open="confirming">
 *   <DialogTrigger>Delete</DialogTrigger>
 *   <DialogPortal>
 *     <DialogOverlay class="backdrop" />
 *     <DialogContent class="panel">
 *       <DialogTitle>Delete this?</DialogTitle>
 *       <DialogClose>Cancel</DialogClose>
 *     </DialogContent>
 *   </DialogPortal>
 * </DialogRoot>
 * ```
 */
import { computed, ref, useId } from 'vue'
import { provideDialogContext } from './context'

const props = withDefaults(
  defineProps<{
    /** Whether the dialog is showing. Use with `v-model:open`. */
    open?: boolean
    /**
     * Whether the dialog blocks the page: scroll lock, `aria-modal`, and a
     * focus trap. Non-modal dialogs are a different control with different
     * rules, and pretending one flag covers both would get the rules wrong.
     */
    modal?: boolean
  }>(),
  { open: false, modal: true },
)

const emit = defineEmits<{
  'update:open': [open: boolean]
}>()

const open = computed(() => props.open)
const modal = computed(() => props.modal)

const id = useId()
const hasTitle = ref(false)
const hasDescription = ref(false)

provideDialogContext({
  open,
  modal,
  show: () => !props.open && emit('update:open', true),
  close: () => props.open && emit('update:open', false),
  contentId: `${id}-content`,
  titleId: `${id}-title`,
  descriptionId: `${id}-description`,
  hasTitle,
  hasDescription,
})
</script>

<template>
  <slot :open="open" />
</template>
