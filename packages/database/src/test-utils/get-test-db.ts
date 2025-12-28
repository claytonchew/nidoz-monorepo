import { config } from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createTursoClient } from "../module/client";
import { getFormattedDate } from "./get-formatted-date";
import { generateRandomTag } from "./get-random-tag";
import { afterAll } from "vitest";
import { rm, mkdir } from "node:fs/promises";
import { createTursoMigrator } from "../module/migrator";
import { createTursoSeeder, type SeedConfig } from "../module/seed";

config({ path: ".env", quiet: true });

const __dirname = path.dirname(fileURLToPath(import.meta.url));

type TestDBConfig = {
	seedConfig?: SeedConfig;
	name?: string;
};

/**
 * Creates and returns a test Turso database client with optional seeding.
 * @more Temporary test database file will be created in `./.test-db` directory and removed after tests complete.
 */
export async function getTestDB(config: TestDBConfig = {}) {
	const dbName =
		config.name ?? `test_db_${getFormattedDate()}_${generateRandomTag()}`;

	const dbDir = path.join(__dirname, "../../.test-db");
	await mkdir(dbDir, { recursive: true });

	const dbFile = path.join(dbDir, `${dbName}.db`);
	const db = createTursoClient({
		connection: { url: `file:${dbFile}` },
		casing: "snake_case",
	});

	const migrator = createTursoMigrator(db, {
		migrationsFolder: path.join(__dirname, "../migrations"),
	});
	await migrator.migrate();

	if (config.seedConfig) {
		const seeder = createTursoSeeder(config.seedConfig);
		await seeder.run(db, {
			seedTests: process.env.DATABASE_ENABLE_SEED_TEST_DATA === "true",
		});
	}

	afterAll(async () => {
		// remove the test db file
		await rm(dbFile).catch(() => {
			/* ignore */
		});
	});

	return { $db: db };
}
