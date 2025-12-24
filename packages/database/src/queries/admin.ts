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

export interface AdminQueries
	extends ReturnType<typeof constructCommonQueries<typeof $schema.admin>> {}
export class AdminQueries {
	constructor(private readonly $db: DrizzleTursoClient) {
		Object.assign(this, constructCommonQueries(this.$db, $schema.admin));
	}

	async getAll(
		{
			page = 1,
			pageSize = 20,
			search = "",
			sort = "desc",
		}: {
			page?: number;
			pageSize?: number;
			search?: string;
			sort?: "asc" | "desc";
		},
		tx?: DrizzleTursoTransaction,
	): Promise<
		Paginated<Omit<typeof $schema.admin.$inferSelect, "hashedPassword">>
	> {
		const db = tx ?? this.$db;
		try {
			const offset = (page - 1) * pageSize;
			const { hashedPassword, ...columns } = {
				...getTableColumns($schema.admin),
			};

			let query = db
				.select(columns)
				.from($schema.admin)
				.orderBy(
					sort === "asc"
						? asc($schema.admin.createdAt)
						: desc($schema.admin.createdAt),
				)
				.limit(pageSize)
				.offset(offset)
				.$dynamic();
			let totalCountQuery = db
				.select({ count: count($schema.admin.id) })
				.from($schema.admin)
				.$dynamic();

			const conditions: any[] = [];
			if (search) {
				conditions.push(
					or(
						eq($schema.admin.id, search),
						ilike($schema.admin.name, `%${search}%`),
						ilike($schema.admin.email, `%${search}%`),
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
}
