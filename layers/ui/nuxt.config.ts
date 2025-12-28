import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const currentDir = dirname(fileURLToPath(import.meta.url));

export default defineNuxtConfig({
	compatibilityDate: "2025-01-15",
	$meta: { name: "ui" },
	srcDir: "src/app",
	serverDir: "src/server",
	dir: {
		public: "src/public",
		modules: "src/modules",
		shared: "src/shared",
	},

	modules: ["@nuxt/ui"],

	css: [join(currentDir, "./src/app/assets/css/main.css")],
});
