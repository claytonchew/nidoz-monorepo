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
			phoneNumber: "+60123456789",
		});

		expect(entry).toHaveProperty("luckyDrawId", "lucky-draw-1");
		expect(entry).toHaveProperty("unitId", unit!.id);
		expect(entry).toHaveProperty("name", "Clayton Chew");
		expect(entry).toHaveProperty("email", "me@claytonchew.com");
		expect(entry).toHaveProperty("phoneNumber", "+60123456789");
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
		expect(entry).toHaveProperty("phoneNumber", "+60123456789");

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
		expect(
			luckyDrawResults.records.find((r) => r.id === "lucky-draw-3")?.entries,
		).toBe(0);

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

	it("should return a lucky draw record with entries", async () => {
		const record = await luckyDrawQueries.getWithEntriesCount("lucky-draw-1");

		expect(record).toHaveProperty("id", "lucky-draw-1");
		expect(record).toHaveProperty("entries");
		expect(record!.entries).toBe(1);
	});

	it("should return a lucky draw record with entries is `0` if there's no entry", async () => {
		const record = await luckyDrawQueries.getWithEntriesCount("lucky-draw-3");

		expect(record).toHaveProperty("id", "lucky-draw-3");
		expect(record).toHaveProperty("entries");
		expect(record!.entries).toBe(0);
	});

	it("should pick random from entries", async () => {
		// generate unit numbers programmatically for multiple floors
		const floors = [
			"A-08",
			"A-09",
			"A-10",
			"A-11",
			"A-12",
			"A-13",
			"A-13A",
			"A-15",
			"A-16",
			"A-17",
			"A-18",
			"A-19",
			"A-20",
		];
		const entries: { unitId: string }[] = [];
		for (const floor of floors) {
			for (let i = 1; i <= 10; i++) {
				let unitNum = i < 10 ? `0${i}` : `${i}`;
				if (unitNum === "04") {
					unitNum = "3A"; // special case for unit 04
				}
				const unitId = (await unitQueries.getByUnit(`${floor}-${unitNum}`))?.id;
				if (unitId) {
					entries.push({ unitId });
				}
			}
		}
		for (const entry of entries) {
			await luckyDrawQueries.createEntry({
				luckyDrawId: "lucky-draw-3",
				...entry,
			});
		}

		const winner = await luckyDrawQueries.pickRandomFromEntries("lucky-draw-3");
		expect(winner).toHaveProperty("luckyDrawId", "lucky-draw-3");

		// it should pick different winner on subsequent calls
		expect(
			await luckyDrawQueries.pickRandomFromEntries("lucky-draw-3"),
		).not.toStrictEqual(winner);
	});
});
