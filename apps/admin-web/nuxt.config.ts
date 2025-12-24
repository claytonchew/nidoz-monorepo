import { fileURLToPath } from "url";

export default defineNuxtConfig({
	compatibilityDate: "2025-01-15",
	alias: {
		"#workspace": fileURLToPath(new URL("../../", import.meta.url)),
	},
	devtools: { enabled: true },
	devServer: { port: 8002 },
	srcDir: "src/app",
	serverDir: "src/server",
	dir: {
		public: "src/public",
		modules: "src/modules",
		shared: "src/shared",
	},

	extends: [
		["@nidoz/base", { install: true }],
		["@nidoz/i18n", { install: true }],
		["@nidoz/ui", { install: true }],
	],
});
