# isoline

Headless, unstyled Vue 3 UI primitives — behaviour and accessibility only. You bring the CSS.

```bash
npm install @monolithrobotics/isoline
```

## What this is

A component here ships keyboard handling, focus management, ARIA wiring and state — and
not one line of visual styling. It renders plain elements with `data-*` attributes you
style yourself:

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { SwitchRoot, SwitchThumb } from '@monolithrobotics/isoline'

const enabled = ref(false)
</script>

<template>
  <SwitchRoot v-model="enabled" name="notifications" class="my-switch">
    <SwitchThumb class="my-switch__thumb" />
  </SwitchRoot>
</template>

<style>
.my-switch { /* your design system, not ours */ }
.my-switch[data-state='checked'] { background: var(--accent); }
.my-switch[data-disabled] { opacity: 0.5; }
.my-switch__thumb[data-state='checked'] { transform: translateX(1rem); }
</style>
```

## Why it exists

It was extracted from [KONTUR](https://github.com/monolithrobotics), a ground control
station, after PrimeVue moved to a commercial licence and archived its MIT line. KONTUR
already owned its whole visual layer and was overriding the library's theme everywhere it
touched it — so what was actually being depended on was the behaviour underneath. This is
that layer, on its own.

**Scope, honestly:** this is built for one product and released because there is no reason
to keep it closed. It is MIT, use it freely — but it is not a funded open-source project.
The API will move before 1.0, issues are answered when someone has time, and components
land when KONTUR needs them rather than to complete a set. If you want the same idea with
support behind it, [reka-ui](https://reka-ui.com) is excellent and we would not be offended.

## Components

| Component | Status |
| --- | --- |
| `Switch` | ✅ |
| `Checkbox`, `RadioGroup`, `Slider`, `NumberField` | planned |
| `Dialog`, `Tooltip`, `Select` | planned |

## Conventions

- **`data-state` over classes.** Components never add or remove classes — yours are left
  exactly as you wrote them. State is readable as `data-state="checked | unchecked"`,
  `data-disabled` and friends.
- **An absent attribute means absent.** `data-disabled` is either an empty string or not
  rendered at all — never `data-disabled="false"`, which every CSS attribute selector
  would match.
- **`v-model` is one-way in, events out.** A component never mutates its own prop; the
  parent stays the single owner of the value.
- **Compound components share state through context.** A part rendered outside its root
  throws immediately with the fix in the message, rather than failing later on `undefined`.

## Development

```bash
npm install
npm run test       # vitest
npm run typecheck  # vue-tsc
npm run lint
npm run build      # vite lib build + bundled .d.ts
```

Vue is a peer dependency and is never bundled — two Vue runtimes in one app break
`provide`/`inject` across the boundary.

## Licence

MIT © Monolith Robotics
