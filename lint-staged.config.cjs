const path = require("node:path");

const lint = (filenames) =>
	`biome format --write ${filenames.map((f) => `"${path.relative(process.cwd(), f)}"`).join(" ")}`;
const format = (filenames) =>
	`biome lint --write ${filenames.map((f) => `"${path.relative(process.cwd(), f)}"`).join(" ")}`;
const test = (filenames) =>
	`vitest related --run ${filenames.map((f) => `"${path.relative(process.cwd(), f)}"`).join(" ")}`;

/** @type {import('lint-staged').Config} */
module.exports = {
	"**/*.{js,jsx,cjs,mjs,json,ts,tsx,html,css,json,vue}": [lint, format],
	"*.{js,ts}": [test],
};
