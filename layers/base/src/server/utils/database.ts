import { createTursoClient } from "@nidoz/database";

let _db: ReturnType<typeof createTursoClient> | null = null;

export const useDB = () => {
	if (!_db) {
		_db = createTursoClient({
			connection: {
				url: process.env.TURSO_CONNECTION_URL!,
				authToken: process.env.TURSO_AUTH_TOKEN!,
			},
			casing: "snake_case",
		});
	}
	return _db;
};

export { $schema } from "@nidoz/database";
