/**
 * className only works on components UniWind knows about.
 *
 * Its Metro resolver rewrites `react-native` imports to UniWind's own components, so a View or a
 * Text understands `className` with no ceremony. Third-party components do not — they take the prop
 * and drop it, with no error and no warning. That is how every screen in this app once rendered
 * blank on device while looking perfect on web, where react-native-web loads the real stylesheet
 * and hides the whole problem.
 *
 * So this fails the build on any `className` passed to a component imported from a package, unless
 * it was put through `withUniwind` first.
 */
import fs from "node:fs";
import path from "node:path";

const ROOTS = ["app", "src", "components"];
const OK_SOURCES = new Set(["react-native", "react"]);

const files = [];
const walk = (dir) => {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) walk(full);
    else if (/\.tsx$/.test(e.name)) files.push(full);
  }
};
for (const r of ROOTS) if (fs.existsSync(r)) walk(r);

const problems = [];
for (const file of files) {
  const src = fs.readFileSync(file, "utf8");
  // Names brought in from a package, minus anything already wrapped by withUniwind in this file.
  const wrapped = new Set([...src.matchAll(/const\s+(\w+)\s*=\s*withUniwind\(/g)].map((m) => m[1]));
  for (const m of src.matchAll(/import\s*\{([^}]+)\}\s*from\s*["']([^"']+)["']/g)) {
    const source = m[2];
    if (OK_SOURCES.has(source) || source.startsWith(".") || source.startsWith("@/")) continue;
    for (const raw of m[1].split(",")) {
      const name = raw.trim().replace(/^type\s+/, "").split(/\s+as\s+/).pop()?.trim();
      if (!name || !/^[A-Z]/.test(name) || wrapped.has(name)) continue;
      if (new RegExp(`<${name}\\b[^>]*className`, "s").test(src)) {
        problems.push(`${file}: <${name}> from "${source}" is given a className but was never wrapped in withUniwind()`);
      }
    }
  }
}

if (problems.length) {
  console.error("className on components UniWind does not patch — these are silently ignored on device:\n");
  for (const p of problems) console.error("  " + p);
  console.error("\nWrap them: const X = withUniwind(RawX)\n");
  process.exit(1);
}
console.log(`className check passed (${files.length} files)`);
