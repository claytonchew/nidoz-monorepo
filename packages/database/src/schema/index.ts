import { createId } from "@paralleldrive/cuid2";
import { index, sqliteTable, unique } from "drizzle-orm/sqlite-core";

export const AdminStatus = {
	Active: "ACTIVE",
	Disabled: "DISABLED",
} as const;
export type AdminStatus = (typeof AdminStatus)[keyof typeof AdminStatus];

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
	status: t.text().notNull().default(AdminStatus.Active),
	name: t.text().notNull(),
	hashedPassword: t.text(),
}));

export const AdminOTPType = {
	Login: "LOGIN",
	ForgotPassword: "FORGOT_PASSWORD",
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
	type: t.text().$type<AdminOTPType>().notNull().default(AdminOTPType.Login),
	identifier: t.text(),
	adminId: t
		.text()
		.references(() => admin.id, { onUpdate: "cascade", onDelete: "cascade" }),
	code: t.text().notNull(),
	token: t.text().notNull(),
	expiresAt: t.integer({ mode: "timestamp" }).notNull(),
	revokedAt: t.integer({ mode: "timestamp" }),
	revokedReason: t.text(),
}));

export const unit = sqliteTable(
	"unit",
	(t) => ({
		id: t
			.text()
			.primaryKey()
			.$default(() => createId()),
		block: t.text().notNull(),
		floor: t.text().notNull(),
		number: t.text().notNull(),
	}),
	(table) => [unique().on(table.block, table.floor, table.number)],
);

export const UnitOTPType = {
	VehicleManagement: "VEHICLE_MANAGEMENT",
} as const;
export type UnitOTPType = (typeof UnitOTPType)[keyof typeof UnitOTPType];

export const unitOTP = sqliteTable("unit_otp", (t) => ({
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
	type: t
		.text()
		.$type<UnitOTPType>()
		.notNull()
		.default(UnitOTPType.VehicleManagement),
	unitId: t
		.text()
		.references(() => unit.id, { onUpdate: "cascade", onDelete: "cascade" }),
	code: t.text().notNull(),
	token: t.text().notNull(),
	expiresAt: t.integer({ mode: "timestamp" }).notNull(),
	revokedAt: t.integer({ mode: "timestamp" }),
	revokedReason: t.text(),
}));

export const vehicle = sqliteTable(
	"vehicle",
	(t) => ({
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
		unitId: t
			.text()
			.references(() => unit.id, { onUpdate: "cascade", onDelete: "cascade" })
			.notNull(),
		numberPlate: t.text().notNull(),
		model: t.text(),
		color: t.text(),
	}),
	(table) => [
		index("idx_vehicle_created_at").on(table.unitId),
		index("idx_vehicle_unit_id").on(table.unitId),
	],
);
