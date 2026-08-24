import js from '@eslint/js'
import pluginVue from 'eslint-plugin-vue'
import { defineConfigWithVueTs, vueTsConfigs } from '@vue/eslint-config-typescript'
import prettierSkipFormatting from 'eslint-config-prettier'

export default defineConfigWithVueTs(
  { ignores: ['dist/**', 'coverage/**', 'node_modules/**'] },
  js.configs.recommended,
  pluginVue.configs['flat/recommended'],
  vueTsConfigs.recommended,
  // Last: switches off every stylistic rule Prettier already owns. Without it
  // `eslint --fix` and `prettier --write` undo each other's line breaks on
  // multi-attribute templates, and neither command ever reaches a fixed point.
  prettierSkipFormatting,
  {
    rules: {
      // Every export is public API — a name has to survive being read out of
      // context, so single-word component files are the point, not a smell.
      'vue/multi-word-component-names': 'off',
    },
  },
)
