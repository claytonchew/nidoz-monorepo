import { parseResidentialUnit } from "@nidoz/utils";
import { and, eq, getTableColumns, sql } from "drizzle-orm";
import { toSnakeCase } from "drizzle-orm/casing";
import type {
	DrizzleTursoClient,
	DrizzleTursoTransaction,
} from "../module/client";
import * as $schema from "../schema";
import { constructCommonQueries } from "./utils";

export interface VehicleQueries
	extends ReturnType<typeof constructCommonQueries<typeof $schema.vehicle>> {}
export class VehicleQueries {
	constructor(private readonly $db: DrizzleTursoClient) {
		Object.assign(this, constructCommonQueries(this.$db, $schema.vehicle));
	}

	async upsertMultiple(
		vehicles: (typeof $schema.vehicle.$inferInsert)[],
		tx?: DrizzleTursoTransaction,
	) {
		const db = tx ?? this.$db;
		try {
			const records = await db
				.insert($schema.vehicle)
				.values(vehicles)
				.onConflictDoUpdate({
					target: $schema.vehicle.id,
					set: {
						unitId: sql.raw(
							`excluded.${toSnakeCase($schema.vehicle.unitId.name)}`,
						),
						numberPlate: sql.raw(
							`excluded.${toSnakeCase($schema.vehicle.numberPlate.name)}`,
						),
						model: sql.raw(
							`excluded.${toSnakeCase($schema.vehicle.model.name)}`,
						),
						color: sql.raw(
							`excluded.${toSnakeCase($schema.vehicle.color.name)}`,
						),
					},
				})
				.returning();
			return records;
		} catch (error) {
			console.error(error);
			throw error;
		}
	}

	async getAllByUnit(unit: string, tx?: DrizzleTursoTransaction) {
		const db = tx ?? this.$db;
		try {
			const parsedUnit = parseResidentialUnit(unit);

			const unitQuery = db.$with("unit_query").as(
				db
					.select({ id: $schema.unit.id })
					.from($schema.unit)
					.where(
						and(
							eq($schema.unit.block, parsedUnit.block),
							eq($schema.unit.floor, parsedUnit.floor),
							eq($schema.unit.number, parsedUnit.number),
						),
					),
			);

			const records = await db
				.with(unitQuery)
				.select(getTableColumns($schema.vehicle))
				.from($schema.vehicle)
				.innerJoin(unitQuery, eq($schema.vehicle.unitId, unitQuery.id));

			return records;
		} catch (error) {
			console.warn(error);
			return [];
		}
	}
}
