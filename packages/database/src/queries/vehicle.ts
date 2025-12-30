import { parseResidentialUnit } from "@nidoz/utils";
import {
	and,
	eq,
	getTableColumns,
	gt,
	inArray,
	isNull,
	sql,
} from "drizzle-orm";
import { toSnakeCase } from "drizzle-orm/casing";
import type {
	DrizzleTursoClient,
	DrizzleTursoTransaction,
} from "../module/client";
import * as $schema from "../schema";
import { UnitOTPQueries } from "./unit";
import { constructCommonQueries } from "./utils";

export interface VehicleQueries
	extends ReturnType<typeof constructCommonQueries<typeof $schema.vehicle>> {}
export class VehicleQueries {
	private unitOTPQueries: UnitOTPQueries;
	constructor(private readonly $db: DrizzleTursoClient) {
		Object.assign(this, constructCommonQueries(this.$db, $schema.vehicle));
		this.unitOTPQueries = new UnitOTPQueries(this.$db);
	}

	async upsertMultiple(
		unitId: string,
		vehicles: (typeof $schema.vehicle.$inferInsert)[],
		tx?: DrizzleTursoTransaction,
	) {
		const db = tx ?? this.$db;
		try {
			const records = await db.transaction(async (tx) => {
				if (!vehicles.length) {
					await tx
						.delete($schema.vehicle)
						.where(eq($schema.vehicle.unitId, unitId));
					return [];
				}

				const existingVehicles = await this.getAllByUnitId(unitId, tx);
				const toRemove = existingVehicles.filter(
					(ev) => !vehicles.some((v) => v.id === ev.id),
				);

				if (toRemove.length) {
					await tx.delete($schema.vehicle).where(
						inArray(
							$schema.vehicle.id,
							toRemove.map((v) => v.id),
						),
					);
				}

				const upserted = await tx
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

				return upserted;
			});
			return records;
		} catch (error) {
			console.error(error);
			throw error;
		}
	}

	async getAllByUnitId(unitId: string, tx?: DrizzleTursoTransaction) {
		const db = tx ?? this.$db;
		try {
			const records = await db
				.select()
				.from($schema.vehicle)
				.where(eq($schema.vehicle.unitId, unitId));

			return records;
		} catch (error) {
			console.warn(error);
			return [];
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

	async getVehicleManagementLink(unit: string, tx?: DrizzleTursoTransaction) {
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
				.select(getTableColumns($schema.unitOTP))
				.from($schema.unitOTP)
				.innerJoin(unitQuery, eq($schema.unitOTP.unitId, unitQuery.id))
				.where(
					and(
						eq($schema.unitOTP.type, $schema.UnitOTPType.VehicleManagement),
						isNull($schema.unitOTP.revokedAt),
						gt($schema.unitOTP.expiresAt, new Date()),
					),
				);

			if (!records.length) {
				return null;
			}

			if (records.length > 1) {
				await db
					.with(unitQuery)
					.update($schema.unitOTP)
					.set({
						revokedAt: new Date(),
						revokedReason: "more than one link exists",
					})
					.where(
						and(
							eq($schema.unitOTP.unitId, sql`(SELECT id FROM ${unitQuery})`),
							eq($schema.unitOTP.type, $schema.UnitOTPType.VehicleManagement),
							isNull($schema.unitOTP.revokedAt),
						),
					);

				return null;
			}

			return {
				url: `${process.env.NUXT_PUBLIC_NIDOZ_SPACE_VEHICLE_MGMT_BASE_URL}/edit?token=${records[0].unitId}:${records[0].token}`,
				expiresAt: records[0].expiresAt,
			};
		} catch (error) {
			console.warn(error);
			return null;
		}
	}

	async createVehicleManagementLink(
		unit: string,
		tx?: DrizzleTursoTransaction,
	) {
		const db = tx ?? this.$db;
		try {
			const parsedUnit = parseResidentialUnit(unit);

			const [unitRecord] = await db
				.select()
				.from($schema.unit)
				.where(
					and(
						eq($schema.unit.block, parsedUnit.block),
						eq($schema.unit.floor, parsedUnit.floor),
						eq($schema.unit.number, parsedUnit.number),
					),
				);

			if (!unitRecord) {
				throw new Error("Unit not found");
			}

			const record = await this.unitOTPQueries.generateVehicleManagement({
				unitId: unitRecord.id,
			});

			if (!record) {
				throw new Error("Failed to create OTP");
			}

			return {
				url: `${process.env.NUXT_PUBLIC_NIDOZ_SPACE_VEHICLE_MGMT_BASE_URL}/edit?token=${record.unitId}:${record.token}`,
				expiresAt: record.expiresAt,
			};
		} catch (error) {
			console.error(error);
			throw error;
		}
	}
}
