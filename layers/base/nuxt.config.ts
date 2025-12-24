export default defineNuxtConfig({
	compatibilityDate: "2025-01-15",
	$meta: { name: "base" },
	srcDir: "src/app",
	serverDir: "src/server",
	dir: {
		public: "src/public",
		modules: "src/modules",
		shared: "src/shared",
	},

	modules: [],
});
