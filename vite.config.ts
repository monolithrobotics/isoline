import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import dts from 'vite-plugin-dts'

export default defineConfig({
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  plugins: [
    vue(),
    // Declarations are emitted per source file rather than bundled into one
    // `.d.ts`. Bundling needs @microsoft/api-extractor — a large dependency
    // whose only gain here is a single file, which nothing consumes: the
    // `exports` map already points type resolution at `dist/index.d.ts`.
    dts({
      tsconfigPath: './tsconfig.build.json',
      insertTypesEntry: true,
      cleanVueFileName: true,
    }),
  ],
  build: {
    lib: {
      entry: fileURLToPath(new URL('./src/index.ts', import.meta.url)),
      formats: ['es'],
      fileName: () => 'isoline.js',
    },
    // Vue stays a peer dependency — bundling it would hand the consumer a
    // second Vue runtime, and `provide`/`inject` does not cross that boundary.
    rollupOptions: { external: ['vue'] },
    sourcemap: true,
    target: 'es2022',
  },
  test: {
    environment: 'jsdom',
    globals: true,
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,vue}'],
      exclude: ['src/index.ts', 'src/**/__tests__/**'],
    },
  },
})
