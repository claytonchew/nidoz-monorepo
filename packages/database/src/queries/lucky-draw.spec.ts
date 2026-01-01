import { and, count, eq, ne } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import insertUnits from "../../seed/jobs/insert-units";
import { defineSeedConfig } from "../module/seed";
import * as $schema from "../schema";
import { getTestDB } from "../test-utils/get-test-db";
import { LuckyDrawQueries } from "./lucky-draw";
import { UnitQueries } from "./unit";

describe("LuckyDrawQueries", async () => {
	const { $db } = await getTestDB({
		seedConfig: defineSeedConfig({
			seed: {
				jobs: {
					insertUnits,
				},
			},
		}),
	});
	const luckyDrawQueries = new LuckyDrawQueries($db);
	const unitQueries = new UnitQueries($db);

	it("should create a single lucky draw campaign", async () => {
		const campaign = await luckyDrawQueries.create({
			id: "lucky-draw-1",
			name: "Lucky Draw 1",
		});
		expect(campaign).toHaveProperty("id", "lucky-draw-1");
		expect(campaign).toHaveProperty("name", "Lucky Draw 1");
	});

	it("should create multiple lucky draw campaign", async () => {
		const campaigns = await luckyDrawQueries.create([
			{
				id: "lucky-draw-2",
				name: "Lucky Draw 2",
			},
			{
				id: "lucky-draw-3",
				name: "Lucky Draw 3",
			},
		]);

		expect(campaigns.length).toBe(2);
		expect(campaigns[0]).toHaveProperty("id", "lucky-draw-2");
		expect(campaigns[1]).toHaveProperty("id", "lucky-draw-3");
		expect(campaigns[0]).toHaveProperty("name", "Lucky Draw 2");
		expect(campaigns[1]).toHaveProperty("name", "Lucky Draw 3");
	});

	it("should create entry in a lucky draw campaign", async () => {
		const unit = await unitQueries.getByUnit("A-32-05");
		const entry = await luckyDrawQueries.createEntry({
			luckyDrawId: "lucky-draw-1",
			unitId: unit!.id,
			name: "Clayton Chew",
			email: "me@claytonchew.com",
		});

		expect(entry).toHaveProperty("luckyDrawId", "lucky-draw-1");
		expect(entry).toHaveProperty("unitId", unit!.id);
		expect(entry).toHaveProperty("name", "Clayton Chew");
		expect(entry).toHaveProperty("email", "me@claytonchew.com");
	});

	it("should not create new entry if unit exist", async () => {
		const unit = await unitQueries.getByUnit("A-32-05");
		const entry = await luckyDrawQueries.createEntry({
			luckyDrawId: "lucky-draw-1",
			unitId: unit!.id,
			name: "Vannesa Lim",
			email: "vannesa@localhost",
		});

		expect(entry).toHaveProperty("luckyDrawId", "lucky-draw-1");
		expect(entry).toHaveProperty("unitId", unit!.id);
		expect(entry).toHaveProperty("name", "Vannesa Lim");
		expect(entry).toHaveProperty("email", "vannesa@localhost");

		const check = await $db
			.select({ count: count($schema.luckyDrawEntry.unitId) })
			.from($schema.luckyDrawEntry)
			.where(
				and(
					eq($schema.luckyDrawEntry.luckyDrawId, "lucky-draw-1"),
					eq($schema.luckyDrawEntry.unitId, unit!.id),
				),
			)
			.groupBy($schema.luckyDrawEntry.luckyDrawId);
		expect(check[0].count).toBe(1);
	});

	it("should return correct entry counts and entries data when getting all", async () => {
		const luckyDraw2Entries = [
			{
				unitId: (await unitQueries.getByUnit("A-08-01"))!.id,
				name: "Participant 1",
				email: "participant1@localhost",
			},
			{
				unitId: (await unitQueries.getByUnit("A-08-02"))!.id,
				name: "Participant 2",
				email: "participant2@localhost",
			},
			{
				unitId: (await unitQueries.getByUnit("A-08-03"))!.id,
				name: "Participant 3",
				email: "participant3@localhost",
			},
		];
		for (const entry of luckyDraw2Entries) {
			await luckyDrawQueries.createEntry({
				luckyDrawId: "lucky-draw-2",
				...entry,
			});
		}

		const luckyDrawResults = await luckyDrawQueries.getAll({ page: 1 });
		expect(
			luckyDrawResults.records.find((r) => r.id === "lucky-draw-1")?.entries,
		).toBe(1);
		expect(
			luckyDrawResults.records.find((r) => r.id === "lucky-draw-2")?.entries,
		).toBe(3);

		const luckyDrawEntriesResults = await luckyDrawQueries.getAllEntries({
			luckyDrawId: "lucky-draw-2",
			page: 1,
		});
		expect(luckyDrawEntriesResults.records.length).toBe(3);
		expect(
			luckyDrawEntriesResults.records.some((r) =>
				luckyDraw2Entries.map((e) => e.unitId).includes(r.id),
			),
		);
	});
});
