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
- **A group is one tab stop.** Where a set of controls belongs together — `RadioGroup`
  today, `Select` later — Tab enters the set once and the arrows move within it, which is
  what the native control does. One tab stop per option strands keyboard users in long
  lists.

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
Consumers should pin an exact version (`"0.1.0"`, not `"^0.1.0"`) and upgrade
deliberately.

**One-time setup**, done by a human, not CI: create the `monolithrobotics` org
on npmjs, then enable trusted publishing for this package (npm → package
settings → Publishing access → GitHub Actions, repo `monolithrobotics/isoline`,
workflow `release.yml`). If npm will not configure a trusted publisher for a
package that does not exist yet, publish `0.1.0` once by hand
(`npm publish --access public`) and enable it immediately after — every release
from then on goes through the tag.

## Licence

MIT © Monolith Robotics
