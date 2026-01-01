import {
	generateRandomCode,
	generateRandomPassword,
	parseResidentialUnit,
} from "@nidoz/utils";
import defu from "defu";
import type { SQL } from "drizzle-orm";
import {
	and,
	asc,
	count,
	desc,
	eq,
	getTableColumns,
	isNull,
	sql,
} from "drizzle-orm";
import type {
	DrizzleTursoClient,
	DrizzleTursoTransaction,
} from "../module/client";
import * as $schema from "../schema";
import { constructCommonQueries } from "./utils";

export interface UnitQueries
	extends ReturnType<typeof constructCommonQueries<typeof $schema.unit>> {}
export class UnitQueries {
	constructor(private readonly $db: DrizzleTursoClient) {
		Object.assign(this, constructCommonQueries(this.$db, $schema.unit));
	}

	async getByUnit(unit: string, tx?: DrizzleTursoTransaction) {
		const db = tx ?? this.$db;
		try {
			const parsed = parseResidentialUnit(unit);
			const [record] = await db
				.select()
				.from($schema.unit)
				.where(
					and(
						eq($schema.unit.block, parsed.block),
						eq($schema.unit.floor, parsed.floor),
						eq($schema.unit.number, parsed.number),
					),
				)
				.limit(1);
			return record ?? null;
		} catch (error) {
			console.warn(error);
			return null;
		}
	}

	async getAll(
		{
			page = 1,
			pageSize = 20,
			search = "",
			filters,
			sort = "asc",
		}: {
			page?: number;
			pageSize?: number;
			search?: string;
			filters?: {
				block?: string;
				floor?: string;
				number?: string;
			};
			sort?: "asc" | "desc";
		},
		tx?: DrizzleTursoTransaction,
	) {
		const db = tx ?? this.$db;
		try {
			const offset = (page - 1) * pageSize;

			const vehiclesQuery = db.$with("vehicles_query").as(
				db
					.select({
						unitId: $schema.vehicle.unitId,
						/**
						 * Drizzle driver does not support JSON array parsing for sqlite,
						 * so we have to do it manually and classify it as string
						 */
						vehicles: sql<string>`
							COALESCE(
								json_group_array(
									json_object(
										'id', ${$schema.vehicle.id},
										'numberPlate', ${$schema.vehicle.numberPlate},
										'model', ${$schema.vehicle.model},
										'color', ${$schema.vehicle.color},
										'createdAt', ${$schema.vehicle.createdAt},
										'updatedAt', ${$schema.vehicle.updatedAt}
									)
								),
								'[]'
							)
						`.as("vehicles"),
					})
					.from($schema.vehicle)
					.groupBy($schema.vehicle.unitId),
			);

			const vehicleManagementLinkQuery = db
				.$with("vehicle_management_link_query")
				.as(
					db
						.select({
							unitId: $schema.unitOTP.unitId,
							hasLink: sql<number>`1`.as("hasLink"),
						})
						.from($schema.unitOTP)
						.where(
							eq($schema.unitOTP.type, $schema.UnitOTPType.VehicleManagement),
						)
						.groupBy($schema.unitOTP.unitId),
				);

			let query = db
				.with(vehiclesQuery, vehicleManagementLinkQuery)
				.select({
					...getTableColumns($schema.unit),
					vehicles:
						sql<string>`COALESCE(${vehiclesQuery.vehicles}, '[]')`.mapWith<
							(val: string) => (typeof $schema.vehicle.$inferSelect)[]
						>((val: string) => {
							const parsed = JSON.parse(val);
							parsed.forEach((vehicle: any) => {
								vehicle.createdAt = new Date(vehicle.createdAt);
								vehicle.updatedAt = new Date(vehicle.updatedAt);
							});
							return parsed;
						}),
					hasVehicleManagementLinkGenerated:
						sql<boolean>`CASE WHEN ${vehicleManagementLinkQuery.hasLink} IS NOT NULL THEN 1 ELSE 0 END`.mapWith(
							(val: number) => Boolean(val),
						),
				})
				.from($schema.unit)
				.orderBy(
					...(sort === "asc"
						? [
								asc($schema.unit.block),
								asc($schema.unit.floor),
								asc($schema.unit.number),
							]
						: [
								desc($schema.unit.block),
								desc($schema.unit.floor),
								desc($schema.unit.number),
							]),
				)
				.leftJoin(vehiclesQuery, eq($schema.unit.id, vehiclesQuery.unitId))
				.leftJoin(
					vehicleManagementLinkQuery,
					eq($schema.unit.id, vehicleManagementLinkQuery.unitId),
				)
				.limit(pageSize)
				.offset(offset)
				.$dynamic();
			let totalCountQuery = db
				.select({ count: count($schema.unit.id) })
				.from($schema.unit)
				.$dynamic();

			const conditions: any[] = [];
			if (filters) {
				if (filters.block && filters.block !== "all") {
					conditions.push(eq($schema.unit.block, filters.block));
				}
				if (filters.floor && filters.floor !== "all") {
					conditions.push(eq($schema.unit.floor, filters.floor));
				}
				if (filters.number && filters.number !== "all") {
					conditions.push(eq($schema.unit.number, filters.number));
				}
			}
			if (search) {
				try {
					const unit = parseResidentialUnit(search.trim());
					conditions.push(
						and(
							eq($schema.unit.block, unit.block),
							eq($schema.unit.floor, unit.floor),
							eq($schema.unit.number, unit.number),
						),
					);
				} catch {
					return {
						records: [],
						totalCount: 0,
						page,
						pageSize,
					};
				}
			}
			if (conditions.length) {
				query = query.where(and(...conditions));
				totalCountQuery = totalCountQuery.where(and(...conditions));
			}

			const [records, totalCount] = await Promise.all([query, totalCountQuery]);

			return {
				records,
				totalCount: totalCount[0]?.count ?? 0,
				page,
				pageSize,
			};
		} catch (error) {
			console.error(error);
			return {
				records: [],
				totalCount: 0,
				page,
				pageSize,
			};
		}
	}
}

export class UnitOTPQueries {
	private readonly config = {
		vehicleManagement: {
			expiresIn: 30 * 24 * 60 * 60, // 30 days
		},
	} as const;

	constructor(private readonly $db: DrizzleTursoClient) {}

	async generate(
		{
			type,
			data,
		}: {
			type: $schema.UnitOTPType;
			data: { unitId?: string; expiresAt?: Date };
		},
		tx?: DrizzleTursoTransaction,
	) {
		const db = tx ?? this.$db;
		const { unitId } = data;

		let expiresAt = data.expiresAt;
		switch (type) {
			case $schema.UnitOTPType.VehicleManagement:
				expiresAt =
					expiresAt ??
					new Date(Date.now() + this.config.vehicleManagement.expiresIn * 1000);
				break;
			default:
				throw new Error("Invalid OTP type");
		}

		try {
			if (!unitId) {
				throw new Error("unitId is required");
			}

			const code = generateRandomCode(8);
			const token = generateRandomPassword(16);

			return await db.transaction(async (tx) => {
				await this.revoke(
					{
						type,
						data: { unitId },
						opts: { revokedReason: "replaced" },
					},
					tx,
				);

				const [record] = await tx
					.insert($schema.unitOTP)
					.values({
						type,
						unitId,
						code,
						token,
						expiresAt,
					})
					.returning();

				if (!record) throw new Error("Fail to create unit OTP");
				return record;
			});
		} catch (error) {
			console.error(error);
			throw error;
		}
	}

	private async revoke(
		{
			type,
			data,
			opts,
		}: {
			type: $schema.UnitOTPType;
			data: {
				id?: string;
				unitId?: string;
				code?: string;
				token?: string;
			};
			opts?: {
				revokedReason?: string;
			};
		},
		tx?: DrizzleTursoTransaction,
	) {
		const db = tx ?? this.$db;
		const { id, unitId, code, token } = data;

		if (!id && !unitId && !token) {
			throw new Error("unitId, or token is required");
		}

		const conditions = [
			eq($schema.unitOTP.type, type),
			isNull($schema.unitOTP.revokedAt),
		];
		if (id) {
			conditions.push(eq($schema.unitOTP.id, id));
		}
		if (unitId) {
			conditions.push(eq($schema.unitOTP.unitId, unitId));
		}
		if (code) {
			conditions.push(eq($schema.unitOTP.code, code));
		}
		if (token) {
			conditions.push(eq($schema.unitOTP.token, token));
		}

		try {
			return await db
				.update($schema.unitOTP)
				.set({ revokedAt: new Date(), revokedReason: opts?.revokedReason })
				.where(and(...conditions))
				.returning();
		} catch (error) {
			console.error(error);
			throw error;
		}
	}

	private async verify(
		{
			type,
			verifier,
			opts,
		}: {
			type: $schema.UnitOTPType;
			verifier: {
				id?: string;
				unitId?: string;
				code?: string;
				token?: string;
			};
			opts?: { revokeOnVerify?: boolean };
		},
		tx?: DrizzleTursoTransaction,
	) {
		const db = tx ?? this.$db;
		const { id, code, token, unitId } = verifier;

		if (!id && !code && !token && !unitId) {
			throw new Error("id, code, token, or unitId is required");
		}
		if (!code && !token) {
			throw new Error("code or token is required for verification");
		}
		if (code && (!token || !id)) {
			throw new Error("id and token are required when verifying with code");
		}

		const conditions = [
			eq($schema.unitOTP.type, type),
			isNull($schema.unitOTP.revokedAt),
		];
		if (id) {
			conditions.push(eq($schema.unitOTP.id, id));
		}
		if (code) {
			conditions.push(eq($schema.unitOTP.code, code));
		}
		if (token) {
			conditions.push(eq($schema.unitOTP.token, token));
		}
		if (unitId) {
			conditions.push(eq($schema.unitOTP.unitId, unitId));
		}

		try {
			const records = await db
				.select()
				.from($schema.unitOTP)
				.where(and(...conditions));

			if (records.length === 0) {
				throw new Error("OTP record not found or already revoked");
			}
			if (records.length > 1) {
				throw new Error("ambigous verifier");
			}

			const record = records[0];

			if (!record) {
				return { result: false as const, record: null };
			}
			if (record.expiresAt < new Date()) {
				throw new Error("OTP has expired");
			}

			if (opts?.revokeOnVerify) {
				await this.update(
					{ type, verifier: { id: record.id }, opts: { allowMultiple: false } },
					{ revokedAt: new Date() },
					tx,
				);
			}

			return { result: true as const, record };
		} catch (error) {
			console.error(error);
			throw error;
		}
	}

	private async update(
		{
			type,
			verifier,
			opts,
		}: {
			type: $schema.UnitOTPType;
			verifier: { id?: string; unitId?: string; token?: string };
			opts?: { unrevokedOnly?: boolean; allowMultiple?: boolean };
		},
		data:
			| Partial<typeof $schema.unitOTP.$inferSelect>
			| Record<string, SQL<any>>,
		tx?: DrizzleTursoTransaction,
	) {
		const db = tx ?? this.$db;
		const { id, token, unitId } = verifier;
		opts = defu(opts, { unrevokedOnly: true, allowMultiple: false });

		if (!id && !token && !unitId) {
			throw new Error("id, token, or unitId is required");
		}

		const conditions = [eq($schema.unitOTP.type, type)];
		if (id) {
			conditions.push(eq($schema.unitOTP.id, id));
		}
		if (token) {
			conditions.push(eq($schema.unitOTP.token, token));
		}
		if (unitId) {
			conditions.push(eq($schema.unitOTP.unitId, unitId));
		}
		if (opts.unrevokedOnly) {
			conditions.push(isNull($schema.unitOTP.revokedAt));
		}

		try {
			return await db.transaction(async (tx) => {
				const records = await tx
					.select()
					.from($schema.unitOTP)
					.where(and(...conditions));

				if (!opts?.allowMultiple && records.length === 0) {
					throw new Error("OTP record not found");
				}
				if (!opts?.allowMultiple && records.length !== 1) {
					throw new Error("ambigous verifier");
				}

				const updates = await tx
					.update($schema.unitOTP)
					.set(data)
					.where(and(...conditions))
					.returning();
				if (updates.length === 0) {
					throw new Error("Fail to update OTP record");
				}

				return opts?.allowMultiple ? updates : updates[0];
			});
		} catch (error) {
			console.error(error);
			throw error;
		}
	}

	async generateVehicleManagement(
		data: { unitId?: string },
		tx?: DrizzleTursoTransaction,
	) {
		if (!data.unitId) {
			throw new Error("unitId are required");
		}

		try {
			return this.generate(
				{ type: $schema.UnitOTPType.VehicleManagement, data },
				tx,
			);
		} catch (error) {
			console.error(error);
			throw error;
		}
	}

	async verifyVehicleManagement(
		verifier: { unitId: string; token: string },
		revoke: boolean = true,
		tx?: DrizzleTursoTransaction,
	) {
		if (!verifier.unitId || !verifier.token) {
			throw new Error("unitId and token are required");
		}

		try {
			const result = await this.verify(
				{
					type: $schema.UnitOTPType.VehicleManagement,
					verifier,
					opts: { revokeOnVerify: revoke },
				},
				tx,
			);

			return result;
		} catch (error) {
			console.warn(error);
			return { result: false as const, record: null };
		}
	}

	async updateVehicleManagement(
		{
			verifier,
			opts,
		}: {
			verifier: { unitId?: string; token?: string };
			opts?: { unrevokedOnly?: boolean; allowMultiple?: boolean };
		},
		data:
			| Partial<typeof $schema.unitOTP.$inferSelect>
			| Record<string, SQL<any>>,
		tx?: DrizzleTursoTransaction,
	) {
		const { unitId, token } = verifier;

		if (!unitId && !token) {
			throw new Error("unitId or token are required");
		}

		try {
			return await this.update(
				{
					type: $schema.UnitOTPType.VehicleManagement,
					verifier,
					opts,
				},
				data,
				tx,
			);
		} catch (error) {
			console.error(error);
			throw error;
		}
	}
}
