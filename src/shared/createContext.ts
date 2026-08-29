import { inject, provide, type InjectionKey } from 'vue'

/**
 * Typed `provide` / `inject` pair for one compound component.
 *
 * Compound components (`<SwitchRoot>` + `<SwitchThumb>`, and later
 * `<SelectRoot>` + its trigger/content/item) pass state down the slot tree
 * rather than through props, because the consumer owns the markup in between
 * and we cannot know how deeply a part is nested.
 *
 * The value of wrapping Vue's primitives is the failure mode: a part rendered
 * outside its root otherwise injects `undefined` and dies later on a property
 * access, pointing at our internals. Here it throws immediately, naming both
 * components and the fix.
 *
 * @param name Component name used in the error message, e.g. `Switch`.
 */
export function createContext<T>(name: string) {
  const key: InjectionKey<T> = Symbol(`isoline:${name}`)

  const provideContext = (value: T): T => {
    provide(key, value)
    return value
  }

  const injectContext = (): T => {
    const context = inject(key, null)
    if (context === null) {
      throw new Error(
        `[isoline] A <${name}> part was rendered outside <${name}Root>. ` +
          `Wrap it in <${name}Root> so it can read the shared state.`,
      )
    }
    return context
  }

  return [provideContext, injectContext] as const
}
