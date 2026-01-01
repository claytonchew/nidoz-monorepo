import {
	AdminOTPQueries,
	AdminQueries,
	createTursoClient,
	LuckyDrawQueries,
	UnitOTPQueries,
	UnitQueries,
	VehicleQueries,
} from "@nidoz/database";

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
export const adminQueries = new AdminQueries(useDB());
export const adminOTPQueries = new AdminOTPQueries(useDB());
export const unitQueries = new UnitQueries(useDB());
export const unitOTPQueries = new UnitOTPQueries(useDB());
export const vehicleQueries = new VehicleQueries(useDB());
export const luckyDrawQueries = new LuckyDrawQueries(useDB());
