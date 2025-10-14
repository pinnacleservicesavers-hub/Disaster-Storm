import { defineConfig } from "tsup";
export default defineConfig({
  entry: ["src/index.ts"],
  dts: true,
  format: ["esm", "cjs"],
  sourcemap: false,
  clean: true,
  minify: false,
  treeshake: true,
  target: "es2020"
});