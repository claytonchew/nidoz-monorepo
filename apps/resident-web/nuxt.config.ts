export default defineNuxtConfig({
	compatibilityDate: "2025-01-15",
	devtools: { enabled: true },
	devServer: { port: 8001 },
	srcDir: "src/app",
	serverDir: "src/server",
	dir: {
		public: "src/public",
		modules: "src/modules",
		shared: "src/shared",
	},

	extends: [["@nidoz/base", { install: true }]],

	modules: ["nuxt-auth-utils"],

	runtimeConfig: {
		session: {
			name: "nrs",
			password: "a0OEvCDJl08kIivfDWcC79ZzhCqOSP4vkm8Rc9QcRF",
			cookie: {
				// this is define here so that dev mode can set ENV NUXT_SESSION_COOKIE_SECURE=false
				secure: true,
			},
		},
	},
});
