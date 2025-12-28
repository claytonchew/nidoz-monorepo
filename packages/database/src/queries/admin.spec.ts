import { and, eq, ne, sql } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import * as $schema from "../schema";
import { getTestDB } from "../test-utils/get-test-db";
import { AdminOTPQueries, AdminQueries } from "./admin";

describe("AdminQueries", async () => {
	const { $db } = await getTestDB();
	const adminQueries = new AdminQueries($db);

	it("should create new admin record", async () => {
		const record = await adminQueries.create({
			id: "admin1",
			name: "Admin 1",
			email: "admin1@localhost",
		});

		expect(record).toHaveProperty("id", "admin1");
		expect(record).toHaveProperty("name", "Admin 1");
		expect(record).toHaveProperty("email", "admin1@localhost");
	});

	it("should create multiple admin records", async () => {
		const records = await adminQueries.create([
			{ id: "admin2", name: "Admin 2", email: "admin2@localhost" },
			{ id: "admin3", name: "Admin 3", email: "admin3@localhost" },
			{ id: "admin4", name: "Admin 4", email: "admin4@localhost" },
		]);

		expect(records).toHaveLength(3);

		for (const [index, record] of records.entries()) {
			expect(record).toHaveProperty("id", `admin${index + 2}`);
			expect(record).toHaveProperty("name", `Admin ${index + 2}`);
			expect(record).toHaveProperty("email", `admin${index + 2}@localhost`);
		}
	});

	it("should update admin record", async () => {
		const record = await adminQueries.update("admin1", {
			name: "Updated Admin 1",
		});

		expect(record).toHaveProperty("id", "admin1");
		expect(record).toHaveProperty("name", "Updated Admin 1");
		expect(record).toHaveProperty("email", "admin1@localhost");
	});

	it("should update multiple admin record", async () => {
		const records = await adminQueries.update(["admin2", "admin3", "admin4"], {
			name: sql`CONCAT(${$schema.admin.name}, ' - Updated')`,
		});

		expect(records).toHaveLength(3);

		for (const [index, record] of records.entries()) {
			expect(record).toHaveProperty("id", `admin${index + 2}`);
			expect(record).toHaveProperty("name", `Admin ${index + 2} - Updated`);
			expect(record).toHaveProperty("email", `admin${index + 2}@localhost`);
		}
	});

	it("should get all records", async () => {
		const { records, totalCount } = await adminQueries.getAll({
			page: 1,
			pageSize: 10,
			sort: "asc",
		});

		expect(totalCount).toBe(4);
		expect(records).toHaveLength(4);

		expect(records[0]).toHaveProperty("id", "admin1");
		expect(records[1]).toHaveProperty("id", "admin2");
		expect(records[2]).toHaveProperty("id", "admin3");
		expect(records[3]).toHaveProperty("id", "admin4");
	});

	it("should remove admin record", async () => {
		const record = await adminQueries.remove("admin1");

		expect(record).toHaveProperty("id", "admin1");
		expect(record).toHaveProperty("name", "Updated Admin 1");
		expect(record).toHaveProperty("email", "admin1@localhost");

		const [check] = await $db
			.select()
			.from($schema.admin)
			.where(eq($schema.admin.id, "admin1"));
		expect(check).not.toBeDefined();
	});

	it("should remove multiple admin record", async () => {
		const records = await adminQueries.remove(["admin2", "admin3", "admin4"]);

		expect(records).toHaveLength(3);

		for (const [index, record] of records.entries()) {
			expect(record).toHaveProperty("id", `admin${index + 2}`);
			expect(record).toHaveProperty("name", `Admin ${index + 2} - Updated`);
			expect(record).toHaveProperty("email", `admin${index + 2}@localhost`);

			const [check] = await $db
				.select()
				.from($schema.admin)
				.where(eq($schema.admin.id, `admin${index + 2}`));
			expect(check).not.toBeDefined();
		}

		expect(
			(await adminQueries.getAll({ page: 1, pageSize: 10 })).records.length,
		).toBe(0);
	});
});

describe("AdminOTPQueries", async () => {
	const { $db } = await getTestDB();
	const adminQueries = new AdminQueries($db);
	const adminOTPQueries = new AdminOTPQueries($db);

	const temp: Record<string, any> = {};

	const admin = await adminQueries.create({
		id: "admin1",
		email: "admin1@localhost",
		name: "Admin 1",
	});

	it("should generate new admin login OTP (using id)", async () => {
		const record = await adminOTPQueries.generateAdminLogin({
			adminId: admin.id,
		});

		expect(record).toHaveProperty("adminId", admin.id);
		expect(record.identifier).toBeNull();
		expect(record.type).toBe($schema.AdminOTPType.Login);
		expect(record.code).not.toBeNull();
		expect(record.token).not.toBeNull();
	});

	it("should generate new admin login OTP (using identifier)", async () => {
		const record = await adminOTPQueries.generateAdminLogin({
			identifier: admin.email,
		});

		expect(record).toHaveProperty("identifier", admin.email);
		expect(record.adminId).toBeNull();
		expect(record.type).toBe($schema.AdminOTPType.Login);
		expect(record.code).not.toBeNull();
		expect(record.token).not.toBeNull();
	});

	it("should update existing admin login OTP", async () => {
		const record = await adminOTPQueries.updateAdminLogin(
			{ verifier: { adminId: admin.id } },
			{
				identifier: admin.email,
			},
		);

		expect(record).toHaveProperty("identifier", admin.email);
	});

	it("should revoke old admin login OTP if new one is generated", async () => {
		const record = await adminOTPQueries.generateAdminLogin({
			identifier: admin.email,
		});

		const check = await $db
			.select()
			.from($schema.adminOTP)
			.where(
				and(
					eq($schema.adminOTP.identifier, admin.email),
					ne($schema.adminOTP.id, record.id),
				),
			);
		for (const otp of check) {
			expect(otp.revokedAt).not.toBeNull();
		}

		// store for next test
		temp.otpToVerify = await adminOTPQueries.updateAdminLogin(
			{ verifier: { token: record.token } },
			{ adminId: admin.id },
		);
	});

	it("should verify OTP without revoking if such opt is passed in", async () => {
		const { adminId, token } = temp.otpToVerify;
		const verify = await adminOTPQueries.verifyAdminLogin(
			{ adminId, token },
			false,
		);

		expect(verify.result).toBe(true);

		const check = await $db
			.select()
			.from($schema.adminOTP)
			.where(eq($schema.adminOTP.id, temp.otpToVerify.id));
		expect(check[0].revokedAt).toBeNull();
	});

	it("should verify OTP and revoke it at the same time by default", async () => {
		const { adminId, token } = temp.otpToVerify;
		const verify = await adminOTPQueries.verifyAdminLogin({ adminId, token });

		expect(verify.result).toBe(true);

		const check = await $db
			.select()
			.from($schema.adminOTP)
			.where(eq($schema.adminOTP.id, temp.otpToVerify.id));
		expect(check[0].revokedAt).not.toBeNull();
	});
});
