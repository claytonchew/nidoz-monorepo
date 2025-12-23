import { defineConfig } from "drizzle-kit";

export default defineConfig({
	dialect: "turso",
	schema: "./src/schema",
	out: "./src/migrations",
	dbCredentials: {
		url: process.env.TURSO_CONNECTION_URL!,
		authToken: process.env.TURSO_AUTH_TOKEN!,
	},
	casing: "snake_case",
	migrations: {
		prefix: "timestamp",
	},
});
