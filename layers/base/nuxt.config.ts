import { fileURLToPath } from "node:url";

export default defineNuxtConfig({
	alias: {
		"#workspace": fileURLToPath(new URL("../../", import.meta.url)),
	},
	compatibilityDate: "2025-01-15",
	$meta: { name: "base" },
	srcDir: "src/app",
	serverDir: "src/server",
	dir: {
		public: "src/public",
		modules: "src/modules",
		shared: "src/shared",
	},

	extends: [
		["@nidoz/i18n", { install: true }],
		["@nidoz/ui", { install: true }],
	],

	modules: ["nuxt-auth-utils", "@nuxt/ui"],
});
