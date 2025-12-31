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

	modules: ["nuxt-auth-utils", "@nuxt/ui", "@vueuse/nuxt"],

	runtimeConfig: {
		public: {
			nidoz: {
				space: {
					resident: {
						baseUrl: "https://nidoz.space",
					},
					admin: {
						baseUrl: "https://admin.nidoz.space",
					},
				},
			},
		},
		internal: {
			nidoz: {
				space: {
					resident: {
						baseUrl: "http://resident-web:8000",
					},
					admin: {
						baseUrl: "http://admin-web:80",
					},
				},
			},
		},
	},
});
