import { eq, getTableName, inArray, type SQL } from "drizzle-orm";
import type { SQLiteTableWithColumns } from "drizzle-orm/sqlite-core";
import type {
	DrizzleTursoClient,
	DrizzleTursoTransaction,
} from "../module/client";

export function constructCommonQueries<
	P extends SQLiteTableWithColumns<{
		name: string;
		schema: undefined;
		columns: Record<string, any>;
		dialect: "sqlite";
	}>,
	I extends keyof P["$inferSelect"] & string = "id",
>($db: DrizzleTursoClient, table: P, identifierKey: I = "id" as I) {
	const entity = getTableName(table);

	type IdentifierType = P["$inferSelect"][I];

	return {
		get: async <IdOrIds extends IdentifierType | IdentifierType[]>(
			identifier: IdOrIds,
			tx?: DrizzleTursoTransaction,
		): Promise<
			IdOrIds extends IdentifierType
				? P["$inferSelect"] | null
				: P["$inferSelect"][]
		> => {
			const db = tx ?? $db;
			try {
				const records = await db
					.select()
					.from(table as any)
					.where(
						Array.isArray(identifier)
							? inArray(table[identifierKey], identifier)
							: eq(table[identifierKey], identifier),
					);
				if (!records.length) throw new Error(`${entity} not found`);
				return Array.isArray(identifier)
					? records
					: // @ts-expect-error
						(records[0] ?? (null as any));
			} catch (error) {
				console.warn(error);
				return Array.isArray(identifier) ? [] : (null as any);
			}
		},
		create: async <D extends P["$inferInsert"] | P["$inferInsert"][]>(
			data: D,
			tx?: DrizzleTursoTransaction,
		): Promise<
			D extends P["$inferInsert"][] ? P["$inferSelect"][] : P["$inferSelect"]
		> => {
			const db = tx ?? $db;
			try {
				const records = (await db
					.insert(table as any)
					.values(data)
					.returning()) as any[];
				if (!records.length) throw new Error(`fail to create ${entity}`);
				return Array.isArray(data) ? records : (records[0] as any);
			} catch (error) {
				console.error(error);
				throw error;
			}
		},
		update: async <IdOrIds extends IdentifierType | IdentifierType[]>(
			identifier: IdOrIds,
			data:
				| Partial<Omit<P["$inferSelect"], typeof identifierKey>>
				| Record<string, SQL<any>>,
			tx?: DrizzleTursoTransaction,
		): Promise<
			IdOrIds extends IdentifierType ? P["$inferSelect"] : P["$inferSelect"][]
		> => {
			const db = tx ?? $db;
			try {
				const records = (await db
					.update(table)
					.set(data as any)
					.where(
						Array.isArray(identifier)
							? inArray(table[identifierKey], identifier)
							: eq(table[identifierKey], identifier),
					)
					.returning()) as any[];
				if (!records.length) throw new Error(`fail to update ${entity}`);
				return Array.isArray(identifier) ? records : (records[0] as any);
			} catch (error) {
				console.error(error);
				throw error;
			}
		},
		remove: async <IdOrIds extends IdentifierType | IdentifierType[]>(
			identifier: IdOrIds,
			tx?: DrizzleTursoTransaction,
		): Promise<
			IdOrIds extends IdentifierType[] ? P["$inferSelect"][] : P["$inferSelect"]
		> => {
			const db = tx ?? $db;
			try {
				const records = await db
					.delete(table)
					.where(
						Array.isArray(identifier)
							? inArray(table[identifierKey], identifier)
							: eq(table[identifierKey], identifier),
					)
					.returning();
				if (!records.length) throw new Error(`fail to delete ${entity}`);
				return Array.isArray(identifier) ? records : (records[0] as any);
			} catch (error) {
				console.error(error);
				throw error;
			}
		},
	};
}
