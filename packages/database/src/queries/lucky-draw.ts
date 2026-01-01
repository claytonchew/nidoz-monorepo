import { parseResidentialUnit } from "@nidoz/utils";
import {
	and,
	asc,
	count,
	desc,
	eq,
	getTableColumns,
	ilike,
	or,
	sql,
} from "drizzle-orm";
import type {
	DrizzleTursoClient,
	DrizzleTursoTransaction,
} from "../module/client";
import * as $schema from "../schema";
import { constructCommonQueries } from "./utils";

export interface LuckyDrawQueries
	extends ReturnType<typeof constructCommonQueries<typeof $schema.luckyDraw>> {}
export class LuckyDrawQueries {
	constructor(private readonly $db: DrizzleTursoClient) {
		Object.assign(this, constructCommonQueries(this.$db, $schema.luckyDraw));
	}

	async getAll(
		{
			page = 1,
			pageSize = 20,
			search = "",
			sort = "asc",
		}: {
			page?: number;
			pageSize?: number;
			search?: string;
			sort?: "asc" | "desc";
		},
		tx?: DrizzleTursoTransaction,
	) {
		const db = tx ?? this.$db;
		try {
			const offset = (page - 1) * pageSize;

			const entryCountQuery = db.$with("entry_count_query").as(
				db
					.select({
						id: $schema.luckyDrawEntry.luckyDrawId,
						entries: count($schema.luckyDrawEntry.unitId).as("entries"),
					})
					.from($schema.luckyDrawEntry)
					.groupBy($schema.luckyDrawEntry.luckyDrawId),
			);

			let query = db
				.with(entryCountQuery)
				.select({
					...getTableColumns($schema.luckyDraw),
					entries: entryCountQuery.entries,
				})
				.from($schema.luckyDraw)
				.leftJoin(entryCountQuery, eq($schema.luckyDraw.id, entryCountQuery.id))
				.orderBy(
					sort === "asc"
						? asc($schema.luckyDraw.createdAt)
						: desc($schema.luckyDraw.createdAt),
				)
				.limit(pageSize)
				.offset(offset)
				.$dynamic();
			let totalCountQuery = db
				.select({ count: count($schema.luckyDraw.id) })
				.from($schema.luckyDraw)
				.$dynamic();

			const conditions: any[] = [];
			if (search) {
				conditions.push(
					or(
						eq($schema.luckyDraw.id, search),
						ilike($schema.luckyDraw.name, `%${search}%`),
					),
				);
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

	async createEntry(
		data: {
			luckyDrawId: string;
			unitId: string;
			name?: string;
			email?: string;
			phoneNumber?: string;
		},
		tx?: DrizzleTursoTransaction,
	) {
		const db = tx ?? this.$db;
		try {
			const [record] = await db
				.insert($schema.luckyDrawEntry)
				.values(data)
				.onConflictDoUpdate({
					target: [
						$schema.luckyDrawEntry.luckyDrawId,
						$schema.luckyDrawEntry.unitId,
					],
					set: {
						name: data.name,
						email: data.email,
						phoneNumber: data.phoneNumber,
					},
				})
				.returning();
			if (!record) {
				throw new Error("Failed to create lucky draw entry");
			}
			return record;
		} catch (error) {
			console.error(error);
			throw error;
		}
	}

	async removeEntry(
		luckyDrawId: string,
		unitId: string,
		tx?: DrizzleTursoTransaction,
	) {
		const db = tx ?? this.$db;
		try {
			const [record] = await db
				.delete($schema.luckyDrawEntry)
				.where(
					and(
						eq($schema.luckyDrawEntry.luckyDrawId, luckyDrawId),
						eq($schema.luckyDrawEntry.unitId, unitId),
					),
				)
				.returning();
			return record;
		} catch (error) {
			console.error(error);
			throw error;
		}
	}

	async getAllEntries(
		{
			luckyDrawId,
			page = 1,
			pageSize = 20,
			search = "",
			sort = "asc",
		}: {
			luckyDrawId: string;
			page?: number;
			pageSize?: number;
			search?: string;
			sort?: "asc" | "desc";
		},
		tx?: DrizzleTursoTransaction,
	) {
		const db = tx ?? this.$db;
		try {
			const offset = (page - 1) * pageSize;

			const unitQuery = db.$with("unit_query").as(
				db
					.select({
						id: $schema.unit.id,
						block: $schema.unit.block,
						floor: $schema.unit.floor,
						number: $schema.unit.number,
						unit: sql<string>`block || '-' || floor || '-' || number`.as(
							"unit",
						),
					})
					.from($schema.luckyDrawEntry)
					.innerJoin(
						$schema.unit,
						eq($schema.luckyDrawEntry.unitId, $schema.unit.id),
					)
					.where(eq($schema.luckyDrawEntry.luckyDrawId, luckyDrawId)),
			);

			let query = db
				.with(unitQuery)
				.select({
					id: unitQuery.id,
					block: unitQuery.block,
					floor: unitQuery.floor,
					number: unitQuery.number,
					unit: unitQuery.unit,
					name: $schema.luckyDrawEntry.name,
					email: $schema.luckyDrawEntry.email,
					phoneNumber: $schema.luckyDrawEntry.phoneNumber,
					createdAt: $schema.luckyDrawEntry.createdAt,
					updatedAt: $schema.luckyDrawEntry.updatedAt,
				})
				.from($schema.luckyDrawEntry)
				.innerJoin(unitQuery, eq($schema.luckyDrawEntry.unitId, unitQuery.id))
				.orderBy(
					sort === "asc"
						? asc($schema.luckyDrawEntry.createdAt)
						: desc($schema.luckyDrawEntry.createdAt),
				)
				.limit(pageSize)
				.offset(offset)
				.$dynamic();
			let totalCountQuery = db
				.select({ count: count($schema.luckyDrawEntry.unitId) })
				.from($schema.luckyDrawEntry)
				.$dynamic();

			const conditions: any[] = [
				eq($schema.luckyDrawEntry.luckyDrawId, luckyDrawId),
			];
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
