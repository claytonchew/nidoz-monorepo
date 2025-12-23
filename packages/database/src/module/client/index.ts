import { drizzle, type LibSQLTransaction } from "drizzle-orm/libsql";

export function createTursoClient(
	...args: Parameters<typeof drizzle>
): ReturnType<typeof drizzle> {
	return drizzle(...args);
}

export type DrizzleTursoClient = ReturnType<typeof createTursoClient>;
export type DrizzleTursoTransaction = LibSQLTransaction<any, any>;
