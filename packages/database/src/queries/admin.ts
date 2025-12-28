import { generateRandomCode, generateRandomPassword } from "@nidoz/utils";
import defu from "defu";
import type { SQL } from "drizzle-orm";
import {
	and,
	asc,
	count,
	desc,
	eq,
	getTableColumns,
	ilike,
	isNull,
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

	async getByEmail(email: string, tx?: DrizzleTursoTransaction) {
		const db = tx ?? this.$db;
		try {
			const record = await db
				.select()
				.from($schema.admin)
				.where(eq($schema.admin.email, email))
				.limit(1);
			return record[0] || null;
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

export class AdminOTPQueries {
	private readonly config = {
		login: {
			expiresIn: 15 * 60, // 15 minutes
		},
		forgotPassword: {
			expiresIn: 60 * 60, // 1 hour
		},
	} as const;

	constructor(private readonly $db: DrizzleTursoClient) {}

	async generate(
		{
			type,
			data,
		}: {
			type: $schema.AdminOTPType;
			data: { adminId?: string; identifier?: string; expiresAt?: Date };
		},
		tx?: DrizzleTursoTransaction,
	) {
		const db = tx ?? this.$db;
		const { adminId, identifier } = data;

		let expiresAt = data.expiresAt;
		switch (type) {
			case $schema.AdminOTPType.Login:
				expiresAt =
					expiresAt ??
					new Date(Date.now() + this.config.login.expiresIn * 1000);
				break;
			case $schema.AdminOTPType.ForgotPassword:
				expiresAt =
					expiresAt ??
					new Date(Date.now() + this.config.forgotPassword.expiresIn * 1000);
				break;
			default:
				throw new Error("Invalid OTP type");
		}

		try {
			if (!adminId && !identifier) {
				throw new Error("adminId or identifier is required");
			}

			const code = generateRandomCode(8);
			const token = generateRandomPassword(16);

			return await db.transaction(async (tx) => {
				await this.revoke(
					{
						type,
						data: { adminId, identifier },
						opts: { revokedReason: "replaced" },
					},
					tx,
				);

				const [record] = await tx
					.insert($schema.adminOTP)
					.values({
						type,
						adminId,
						identifier,
						code,
						token,
						expiresAt,
					})
					.returning();

				if (!record) throw new Error("Fail to create admin OTP");
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
			type: $schema.AdminOTPType;
			data: {
				id?: string;
				adminId?: string;
				identifier?: string;
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
		const { id, adminId, identifier, code, token } = data;

		if (!id && !adminId && !identifier && !token) {
			throw new Error("adminId, identifier, or token is required");
		}

		const conditions = [
			eq($schema.adminOTP.type, type),
			isNull($schema.adminOTP.revokedAt),
		];
		if (id) {
			conditions.push(eq($schema.adminOTP.id, id));
		}
		if (adminId) {
			conditions.push(eq($schema.adminOTP.adminId, adminId));
		}
		if (identifier) {
			conditions.push(eq($schema.adminOTP.identifier, identifier));
		}
		if (code) {
			conditions.push(eq($schema.adminOTP.code, code));
		}
		if (token) {
			conditions.push(eq($schema.adminOTP.token, token));
		}

		try {
			return await db
				.update($schema.adminOTP)
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
			type: $schema.AdminOTPType;
			verifier: {
				id?: string;
				adminId?: string;
				identifier?: string;
				code?: string;
				token?: string;
			};
			opts?: { revokeOnVerify?: boolean };
		},
		tx?: DrizzleTursoTransaction,
	) {
		const db = tx ?? this.$db;
		const { id, code, token, adminId, identifier } = verifier;

		if (!id && !code && !token && !adminId && !identifier) {
			throw new Error("id, code, token, adminId, or identifier is required");
		}
		if (!code && !token) {
			throw new Error("code or token is required for verification");
		}
		if (code && (!identifier || !token || !id)) {
			throw new Error(
				"id, identifier and token are required when verifying with code",
			);
		}

		const conditions = [
			eq($schema.adminOTP.type, type),
			isNull($schema.adminOTP.revokedAt),
		];
		if (id) {
			conditions.push(eq($schema.adminOTP.id, id));
		}
		if (code) {
			conditions.push(eq($schema.adminOTP.code, code));
		}
		if (token) {
			conditions.push(eq($schema.adminOTP.token, token));
		}
		if (adminId) {
			conditions.push(eq($schema.adminOTP.adminId, adminId));
		}
		if (identifier) {
			conditions.push(eq($schema.adminOTP.identifier, identifier));
		}

		try {
			const records = await db
				.select()
				.from($schema.adminOTP)
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
			type: $schema.AdminOTPType;
			verifier: { id?: string; adminId?: string; token?: string };
			opts?: { unrevokedOnly?: boolean; allowMultiple?: boolean };
		},
		data:
			| Partial<typeof $schema.adminOTP.$inferSelect>
			| Record<string, SQL<any>>,
		tx?: DrizzleTursoTransaction,
	) {
		const db = tx ?? this.$db;
		const { id, token, adminId } = verifier;
		opts = defu(opts, { unrevokedOnly: true, allowMultiple: false });

		if (!id && !token && !adminId) {
			throw new Error("id, token, or adminId is required");
		}

		const conditions = [eq($schema.adminOTP.type, type)];
		if (id) {
			conditions.push(eq($schema.adminOTP.id, id));
		}
		if (token) {
			conditions.push(eq($schema.adminOTP.token, token));
		}
		if (adminId) {
			conditions.push(eq($schema.adminOTP.adminId, adminId));
		}
		if (opts.unrevokedOnly) {
			conditions.push(isNull($schema.adminOTP.revokedAt));
		}

		try {
			return await db.transaction(async (tx) => {
				const records = await tx
					.select()
					.from($schema.adminOTP)
					.where(and(...conditions));

				if (!opts?.allowMultiple && records.length === 0) {
					throw new Error("OTP record not found");
				}
				if (!opts?.allowMultiple && records.length !== 1) {
					throw new Error("ambigous verifier");
				}

				const updates = await tx
					.update($schema.adminOTP)
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

	async generateAdminLogin(
		data: { adminId?: string; identifier?: string },
		tx?: DrizzleTursoTransaction,
	) {
		if (!data.adminId && !data.identifier) {
			throw new Error("adminId or identifier are required");
		}

		try {
			return this.generate({ type: $schema.AdminOTPType.Login, data }, tx);
		} catch (error) {
			console.error(error);
			throw error;
		}
	}

	async verifyAdminLogin(
		verifier: { adminId: string; token: string },
		revoke: boolean = true,
		tx?: DrizzleTursoTransaction,
	) {
		if (!verifier.adminId || !verifier.token) {
			throw new Error("adminId and token are required");
		}

		try {
			return this.verify(
				{
					type: $schema.AdminOTPType.Login,
					verifier,
					opts: { revokeOnVerify: revoke },
				},
				tx,
			);
		} catch (error) {
			console.error(error);
			throw error;
		}
	}

	async updateAdminLogin(
		{
			verifier,
			opts,
		}: {
			verifier: { adminId?: string; token?: string };
			opts?: { unrevokedOnly?: boolean; allowMultiple?: boolean };
		},
		data:
			| Partial<typeof $schema.adminOTP.$inferSelect>
			| Record<string, SQL<any>>,
		tx?: DrizzleTursoTransaction,
	) {
		const { adminId, token } = verifier;

		if (!adminId && !token) {
			throw new Error("adminId or token are required");
		}

		try {
			return await this.update(
				{
					type: $schema.AdminOTPType.Login,
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
