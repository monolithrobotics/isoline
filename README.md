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
.my-switch {
  /* your design system, not ours */
}
.my-switch[data-state='checked'] {
  background: var(--accent);
}
.my-switch[data-disabled] {
  opacity: 0.5;
}
.my-switch__thumb[data-state='checked'] {
  transform: translateX(1rem);
}
</style>
```

Components with more than one moving part are compound: a root that owns the state and
parts that read it, so every element between them is yours to write, style and place.

```vue
<script setup lang="ts">
import { ref } from 'vue'
import {
  SelectRoot,
  SelectTrigger,
  SelectPortal,
  SelectContent,
  SelectItem,
  SelectItemIndicator,
} from '@monolithrobotics/isoline'

const modes = [
  { value: 'auto', label: 'Automatic' },
  { value: 'manual', label: 'Manual' },
]
const mode = ref<string>()
const open = ref(false)
</script>

<template>
  <SelectRoot v-model="mode" v-model:open="open" name="mode">
    <!-- The library does not know your labels, so the trigger's content is yours. -->
    <SelectTrigger class="trigger">
      {{ modes.find((m) => m.value === mode)?.label ?? 'Pick a mode' }}
    </SelectTrigger>

    <SelectPortal>
      <SelectContent class="listbox">
        <SelectItem v-for="m in modes" :key="m.value" :value="m.value" class="option">
          {{ m.label }}
          <SelectItemIndicator>✓</SelectItemIndicator>
        </SelectItem>
      </SelectContent>
    </SelectPortal>
  </SelectRoot>
</template>

<style>
.option[data-highlighted] {
  background: var(--accent);
}
.listbox[data-side='top'] {
  transform-origin: bottom;
}
</style>
```

## Why it exists

It was extracted from an internal application after PrimeVue moved to a commercial
licence and archived its MIT line. That application already owned its whole visual
layer and was overriding the library's theme everywhere it touched it — so what was
actually being depended on was the behaviour underneath. This is that layer, on its own.

**Scope, honestly:** this is built for one application and released because there is no
reason to keep it closed. It is MIT, use it freely — but it is not a funded open-source
project. The API will move before 1.0, issues are answered when someone has time, and
components land when that application needs them rather than to complete a set. If you
want the same idea with support behind it, [reka-ui](https://reka-ui.com) is excellent
and we would not be offended.

## Components

| Component                | Status           |
| ------------------------ | ---------------- |
| `Switch`                 | ✅               |
| `Checkbox`               | ✅               |
| `RadioGroup`             | ✅               |
| `Dialog`                 | ✅ modal         |
| `Select`                 | ✅ single choice |
| `Slider`                 | ✅               |
| `NumberField`            | ✅               |
| `Tooltip`, `MultiSelect` | planned          |

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
- **A group is one tab stop.** Where a set of controls belongs together — `RadioGroup`,
  `Select` — Tab enters the set once and the arrows move within it, which is what the
  native control does. One tab stop per option strands keyboard users in long lists.
- **Popups are portalled, positions are published.** Anything that floats renders at the
  end of `<body>`, out of reach of an ancestor's `overflow: hidden` or `transform`.
  Where a position is continuous rather than a state — a slider's — it arrives as a CSS
  custom property (`--isoline-slider-fraction`, 0 to 1) so you decide whether it means
  `left`, `height` or a rotation.

## Development

Node 24 — earlier majors cannot run the build (`vite` needs a `node:util` export added
after 20.11), and CI verifies on 24.

```bash
npm install
npm run test       # vitest
npm run typecheck  # vue-tsc
npm run lint
npm run build      # vite lib build + bundled .d.ts
```

Vue is a peer dependency and is never bundled — two Vue runtimes in one app break
`provide`/`inject` across the boundary.

## Releasing

Published to npm as [`@monolithrobotics/isoline`](https://www.npmjs.com/package/@monolithrobotics/isoline)
by [`.github/workflows/release.yml`](.github/workflows/release.yml), which fires
on a `v*` tag and nothing else. There is no publish token in this repo — the
workflow authenticates to npm through GitHub OIDC (trusted publishing) and
attaches a provenance attestation.

```bash
npm version minor          # or patch — pre-1.0, breaking changes go in minor
git push --follow-tags
```

The workflow re-runs lint, format, typecheck, test and build before publishing,
and refuses a tag whose version disagrees with `package.json`.

**Pre-1.0 versioning.** The API moves before 1.0, so a minor bump may break you.
Consumers should pin an exact version (`"0.2.0"`, not `"^0.2.0"`) and upgrade
deliberately.

Trusted publishing is configured against this repository and `release.yml`, and the
package requires two-factor authentication with bypass tokens disallowed — so a leaked
token cannot publish, and a release that did not come from a tag on this repo cannot
exist. `0.1.0` was published by hand to bootstrap that, and carries no provenance
attestation; every release since goes through the tag.

## Licence

MIT © Monolith Robotics
