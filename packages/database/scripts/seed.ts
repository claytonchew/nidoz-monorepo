import { config } from "dotenv";
import { createTursoClient, createTursoSeeder, seedConfig } from "../src/index";

config({ path: ".env" });
const { TURSO_CONNECTION_URL: url, TURSO_AUTH_TOKEN: authToken } = process.env;

if (!url || !authToken) {
	throw new Error("TURSO_CONNECTION_URL or TURSO_AUTH_TOKEN is missing.");
}

const db = createTursoClient({
	connection: { url, authToken },
	casing: "snake_case",
});
const seeder = createTursoSeeder(seedConfig);

const main = async () => {
	seeder
		.run(db, {
			seedTests: process.env.DATABASE_ENABLE_SEED_TEST_DATA === "true",
		})
		.then(() => {
			console.log("Seeding completed!");
			process.exit(0);
		})
		.catch((e) => {
			console.error(e);
			process.exit(1);
		});
};

main();
