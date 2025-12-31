import path from "node:path";
import { fileURLToPath } from "node:url";
import {
	createTursoClient,
	createTursoMigrator,
	createTursoSeeder,
	type DrizzleTursoClient,
	type DrizzleTursoMigrator,
	type SeedModule,
	seedConfig,
} from "@nidoz/database";

let _db: DrizzleTursoClient | null = null;
let _migrator: DrizzleTursoMigrator | null = null;
let _seeder: SeedModule | null = null;

const useDB = () => {
	if (!_db) {
		_db = createTursoClient({
			connection: {
				url: process.env.TURSO_CONNECTION_URL,
				authToken: process.env.TURSO_AUTH_TOKEN,
			},
			casing: "snake_case",
		});
	}
	return _db;
};

const useMigrator = () => {
	const __filename = fileURLToPath(import.meta.url);
	const __dirname = path.dirname(__filename);

	if (!_migrator) {
		_migrator = createTursoMigrator(useDB(), {
			migrationsFolder: import.meta.dev
				? path.join(__dirname, "../../../../packages/database/src/migrations")
				: // only for production build in docker
					"/app/.output/migrations",
		});
	}

	return _migrator;
};

const useSeeder = () => {
	if (!_seeder) {
		_seeder = createTursoSeeder(seedConfig);
	}

	return {
		run: async () => {
			return await _seeder.run(useDB(), {
				seedTests: process.env.DATABASE_ENABLE_SEED_TEST_DATA === "true",
			});
		},
	};
};

export { useDB, useMigrator, useSeeder };
