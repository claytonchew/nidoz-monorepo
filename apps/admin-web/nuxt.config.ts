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

	runtimeConfig: {
		session: {
			name: "nas",
			password: "lO1hmvEb7LdPvEXNlXeiR8rIuadUqgdGPANOTH0J5F",
			cookie: {
				// this is define here so that dev mode can set ENV NUXT_SESSION_COOKIE_SECURE=false
				secure: true,
			},
		},
	},
});
