/**
 * UniWind does its work in Metro, not Babel — the only preset here is Expo's own.
 * The resolver gives `@/…` its meaning; Tailwind v4 is CSS-first, so the theme lives in global.css,
 * written by scripts/gen-theme.mjs from the palette.
 */
module.exports = function (api) {
  api.cache(true);

  return {
    presets: [["babel-preset-expo"]],
    plugins: [
      [
        "module-resolver",
        {
          root: ["./"],
          alias: {
            "@": "./",
            // gluestack generates `import { styled } from "nativewind"` and offers no way to
            // change that after init. This app runs on UniWind, and NativeWind's native runtime
            // refuses to load unless it wrapped the Metro config — which it does not. The alias
            // lets gluestack's components stay exactly as generated. See src/compat/nativewind.ts.
            nativewind: "./src/compat/nativewind.ts",
          },
        },
      ],
      "react-native-worklets/plugin",
    ],
  };
};
