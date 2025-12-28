export default defineNuxtConfig({
	compatibilityDate: "2025-01-15",
	devtools: { enabled: true },
	devServer: { port: 8002 },
	srcDir: "src/app",
	serverDir: "src/server",
	dir: {
		public: "src/public",
		modules: "src/modules",
		shared: "src/shared",
	},

	extends: [["@nidoz/base", { install: true }]],

	modules: ["nuxt-auth-utils"],
});
