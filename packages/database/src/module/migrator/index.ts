import type { drizzle } from "drizzle-orm/libsql";
import { migrate } from "drizzle-orm/libsql/migrator";

export function createTursoMigrator(
	db: ReturnType<typeof drizzle>,
	{ migrationsFolder }: { migrationsFolder: string },
) {
	return {
		migrate: async () => await migrate(db, { migrationsFolder }),
	};
}
