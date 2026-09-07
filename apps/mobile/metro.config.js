const { getDefaultConfig } = require("expo/metro-config");
const { withUniwindConfig } = require("uniwind/metro");

/**
 * UniWind rather than NativeWind for the Tailwind v4 engine.
 *
 * NativeWind's v5 preview fails to transform ANY css file on this Expo SDK — including Expo's own
 * log-box stylesheet — with "failed to deserialize; expected an object-like struct named Specifier".
 * UniWind is the other engine the gluestack v5 skill names, it is Expo-only (which this is), and it
 * keeps the same Tailwind v4 CSS-first theme, so global.css and the palette bridge are unchanged.
 * Revisit NativeWind when v5 leaves preview.
 */
module.exports = withUniwindConfig(getDefaultConfig(__dirname), {
  cssEntryFile: "./global.css",
  dtsFile: "./uniwind-types.d.ts",
});
