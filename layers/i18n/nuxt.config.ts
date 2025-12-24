import { dirname, join } from "path";
import { fileURLToPath } from "url";

const currentDir = dirname(fileURLToPath(import.meta.url));

export default defineNuxtConfig({
	compatibilityDate: "2025-01-15",
	$meta: { name: "i18n" },
	srcDir: "src/app",
	serverDir: "src/server",
	dir: {
		public: "src/public",
		modules: "src/modules",
		shared: "src/shared",
	},

	modules: ["@nuxtjs/i18n"],

	i18n: {
		restructureDir: join(currentDir, "./src/i18n"),
		vueI18n: join(currentDir, "./i18n.config.ts"),
		detectBrowserLanguage: {
			useCookie: true,
			cookieKey: "locale",
			redirectOn: "all",
		},
		defaultLocale: "en",
		langDir: "./locales",
		locales: [
			{
				name: "English",
				code: "en",
				language: "en",
				dir: "ltr",
				file: "en.ts",
			},
			{
				name: "Bahasa Malaysia",
				code: "ms",
				language: "ms",
				dir: "ltr",
				file: "ms.ts",
			},
			{ name: "中文", code: "zh", language: "zh", dir: "ltr", file: "zh.ts" },
		],
		experimental: {
			localeDetector: "localeDetector.ts",
		},
	},
});
