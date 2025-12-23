import { getTestDB } from "./get-test-db";
import { describe, expect, it } from "vitest";
import * as schema from "../schema";

describe("getTestDB", async () => {
	const { $db } = await getTestDB();

	it("should create test db instance", async () => {
		const result = await $db.run("select 1").execute();
		expect(result.rows.length).toBe(1);
	});
});
