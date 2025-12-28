import {
	and,
	asc,
	count,
	desc,
	eq,
	getTableColumns,
	ilike,
	or,
} from "drizzle-orm";
import type {
	DrizzleTursoClient,
	DrizzleTursoTransaction,
} from "../module/client";
import * as $schema from "../schema";
import type { Paginated } from "./types";
import { constructCommonQueries } from "./utils";
import { parseResidentialUnit } from "@nidoz/utils";

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
	): Promise<
		Paginated<Omit<typeof $schema.unit.$inferSelect, "hashedPassword">>
	> {
		const db = tx ?? this.$db;
		try {
			const offset = (page - 1) * pageSize;

			let query = db
				.select()
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
				.limit(pageSize)
				.offset(offset)
				.$dynamic();
			let totalCountQuery = db
				.select({ count: count($schema.unit.id) })
				.from($schema.unit)
				.$dynamic();

			const conditions: any[] = [];
			if (filters) {
				if (filters.block) {
					conditions.push(eq($schema.unit.block, filters.block));
				}
				if (filters.floor) {
					conditions.push(eq($schema.unit.floor, filters.floor));
				}
				if (filters.number) {
					conditions.push(eq($schema.unit.number, filters.number));
				}
			}
			if (search) {
				try {
					const unit = parseResidentialUnit(search);
					conditions.push(
						and(
							eq($schema.unit.block, unit.block),
							eq($schema.unit.floor, unit.floor),
							eq($schema.unit.number, unit.number),
						),
					);
				} catch {}
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
