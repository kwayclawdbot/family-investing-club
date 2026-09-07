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
      ["module-resolver", { root: ["./"], alias: { "@": "./" } }],
      "react-native-worklets/plugin",
    ],
  };
};
