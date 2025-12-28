import { and, eq, ne, sql } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import * as $schema from "../schema";
import { getTestDB } from "../test-utils/get-test-db";
import { UnitQueries } from "./unit";
import { defineSeedConfig } from "../module/seed";
import insertUnits from "../../seed/jobs/insert-units";

describe("UnitQueries", async () => {
	const { $db } = await getTestDB({
		seedConfig: defineSeedConfig({
			seed: {
				jobs: {
					insertUnits,
				},
			},
		}),
	});
	const unitQueries = new UnitQueries($db);

	it("should get unit by unit string", async () => {
		const unit = await unitQueries.getByUnit("A-32-05");
		expect(unit).not.toBeNull();
	});

	it("should get all units", async () => {
		const units = await unitQueries.getAll({ page: 1, pageSize: 100 });
		expect(units.records.length).toBe(100);
	});
});
