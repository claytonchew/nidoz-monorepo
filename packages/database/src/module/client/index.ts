import type { LibSQLTransaction } from "drizzle-orm/libsql";
import { drizzle } from "drizzle-orm/libsql/web";
// Issue: https://github.com/tursodatabase/libsql-client-ts/issues/112
// import { drizzle } from "drizzle-orm/libsql";

export function createTursoClient(
	...args: Parameters<typeof drizzle>
): ReturnType<typeof drizzle> {
	return drizzle(...args);
}

export type DrizzleTursoClient = ReturnType<typeof createTursoClient>;
export type DrizzleTursoTransaction = LibSQLTransaction<any, any>;
