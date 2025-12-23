import { createId } from "@paralleldrive/cuid2";
import { sqliteTable, unique } from "drizzle-orm/sqlite-core";

export const admin = sqliteTable("admin", (t) => ({
	id: t
		.text()
		.primaryKey()
		.$default(() => createId()),
	createdAt: t
		.integer({ mode: "timestamp" })
		.notNull()
		.$default(() => new Date()),
	updatedAt: t
		.integer({ mode: "timestamp" })
		.notNull()
		.$default(() => new Date())
		.$onUpdate(() => new Date()),
	email: t.text().notNull().unique(),
	emailConfirmedAt: t.integer({ mode: "timestamp" }),
	name: t.text().notNull(),
	hashedPassword: t.text(),
}));

export const AdminOTPType = {
	login: "LOGIN",
} as const;
export type AdminOTPType = (typeof AdminOTPType)[keyof typeof AdminOTPType];

export const adminOTP = sqliteTable("admin_otp", (t) => ({
	id: t
		.text()
		.primaryKey()
		.$default(() => createId()),
	createdAt: t
		.integer({ mode: "timestamp" })
		.notNull()
		.$default(() => new Date()),
	updatedAt: t
		.integer({ mode: "timestamp" })
		.notNull()
		.$default(() => new Date())
		.$onUpdate(() => new Date()),
	type: t.text().notNull().default(AdminOTPType.login),
	adminId: t
		.text()
		.notNull()
		.references(() => admin.id, { onUpdate: "cascade", onDelete: "cascade" }),
	token: t.text().notNull(),
	expiredAt: t.integer({ mode: "timestamp" }).notNull(),
	revokedAt: t.integer({ mode: "timestamp" }),
}));

export const unit = sqliteTable(
	"unit",
	(t) => ({
		id: t
			.text()
			.primaryKey()
			.$default(() => createId()),
		block: t.text().notNull(),
		floor: t.integer().notNull(),
		number: t.integer().notNull(),
	}),
	(table) => [unique().on(table.block, table.floor, table.number)],
);
