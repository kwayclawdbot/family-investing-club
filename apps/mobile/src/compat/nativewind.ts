/**
 * A NativeWind-shaped door onto UniWind.
 *
 * gluestack generates its components with `import { styled } from "nativewind"`, and there is no
 * flag that changes that after `init`. But this app runs on UniWind, because NativeWind's v5
 * preview cannot transform a single css file on Expo SDK 57 (see metro.config.js). Installing
 * NativeWind anyway to satisfy the import got the web bundle running and then failed on device:
 * its native runtime asserts that `withNativeWind` wrapped the Metro config, which it cannot,
 * because UniWind wraps it instead.
 *
 * So the package is gone and `nativewind` is aliased here in babel.config.js. gluestack's
 * components — the three that exist and any added later — keep working untouched, and there is one
 * file that explains why rather than three edits that do not.
 *
 * `styled` exists to let a component that only understands `style` accept a `className`.
 * `withUniwind` is the same idea with the mapping written the other way round, so the only work
 * here is turning one option shape into the other.
 */
import { withUniwind } from "uniwind";

import type { ComponentPropsWithRef, JSXElementConstructor, ReactNode } from "react";

type AnyComponent = JSXElementConstructor<any>;

/** What `styled` hands back: the component's own props, plus the class props UniWind adds. */
type Styled<T extends AnyComponent> = (
  props: ComponentPropsWithRef<T> & { className?: string; [key: `${string}ClassName`]: string | undefined },
) => ReactNode;

/** NativeWind: `{ className: "style" }` — the class prop, then the style prop it feeds. */
type StyledOptions = Record<string, string | { target: string }>;

export function styled<T extends AnyComponent>(Component: T, options?: StyledOptions): Styled<T> {
  if (!options) return withUniwind(Component as never) as Styled<T>;

  // UniWind keys by the STYLE prop and names the class prop inside, which is the inverse of
  // NativeWind's mapping — so the pairs are flipped rather than passed through.
  const mapping: Record<string, { fromClassName: string }> = {};
  for (const [fromClassName, target] of Object.entries(options)) {
    const styleProp = typeof target === "string" ? target : target.target;
    mapping[styleProp] = { fromClassName };
  }

  // `{ className: "style" }` is what every gluestack component asks for, and it is already
  // withUniwind's default — so that case takes the plain path rather than a rebuilt mapping.
  const isDefault = Object.keys(mapping).length === 1 && mapping.style?.fromClassName === "className";
  return (isDefault ? withUniwind(Component as never) : withUniwind(Component as never, mapping as never)) as Styled<T>;
}

/** NativeWind also exports these two; nothing in this app uses them, and a silent no-op would lie. */
export function useColorScheme(): never {
  throw new Error("This app runs on UniWind — use `useUniwind()` from 'uniwind' instead of NativeWind's useColorScheme.");
}
