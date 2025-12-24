import { eq, sql } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import * as $schema from "../schema";
import { getTestDB } from "../test-utils/get-test-db";
import { AdminQueries } from "./admin";

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
