import { defineConfig } from "tsdown";

export default defineConfig({
	exports: true,
	dts: true,
	format: ["cjs", "esm"],
	entry: ["src/index.ts"],
});
