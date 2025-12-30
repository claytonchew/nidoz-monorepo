import { describe, expect, it } from "vitest";
import type * as $schema from "../schema";
import { getTestDB } from "../test-utils/get-test-db";
import { UnitQueries } from "./unit";
import { VehicleQueries } from "./vehicle";

describe("VehicleQueries", async () => {
	const { $db } = await getTestDB();
	const unitQueries = new UnitQueries($db);
	const vehicleQueries = new VehicleQueries($db);

	const units = await unitQueries.create([
		{
			id: "A-01-01",
			block: "A",
			floor: "01",
			number: "01",
		},
		{
			id: "A-01-02",
			block: "A",
			floor: "01",
			number: "02",
		},
	]);

	const temp: Record<string, any> = {};

	it("should insert a new vehicle record", async () => {
		const vehicle = await vehicleQueries.create({
			unitId: units[0].id,
			numberPlate: "A1",
			model: "Chery Omoda",
			color: "White",
		});

		expect(vehicle).toHaveProperty("id");
		expect(vehicle).toHaveProperty("unitId", units[0].id);
		expect(vehicle).toHaveProperty("numberPlate", "A1");

		temp.vehicles = [vehicle];
	});

	it("should upsert multiple", async () => {
		const vehicles = [
			{
				...temp.vehicles[0],
				color: "Black",
			},
			{
				unitId: units[0].id,
				numberPlate: "A2",
				model: "Toyota Vios",
				color: "Silver",
			},
		];

		const records = await vehicleQueries.upsertMultiple(units[0].id, vehicles);

		expect(records.length).toBe(2);

		for (const [index, record] of records.entries()) {
			if (index === 0) {
				expect(record).toHaveProperty("id", vehicles[index].id);
			}
			expect(record).toHaveProperty("unitId", vehicles[index].unitId);
			expect(record).toHaveProperty("numberPlate", vehicles[index].numberPlate);
			expect(record).toHaveProperty("model", vehicles[index].model);
			expect(record).toHaveProperty("color", vehicles[index].color);
		}

		temp.vehicles = records;
	});

	it("should upsert new records (no updates)", async () => {
		const vehicles = [
			{
				unitId: units[1].id,
				numberPlate: "B1",
				model: "Honda Civic",
				color: "Blue",
			},
			{
				unitId: units[1].id,
				numberPlate: "B2",
				model: "Honda City",
				color: "Black",
			},
		];

		const records = await vehicleQueries.upsertMultiple(units[1].id, vehicles);

		expect(records.length).toBe(2);

		for (const [index, record] of records.entries()) {
			expect(record).toHaveProperty("unitId", vehicles[index].unitId);
			expect(record).toHaveProperty("numberPlate", vehicles[index].numberPlate);
			expect(record).toHaveProperty("model", vehicles[index].model);
			expect(record).toHaveProperty("color", vehicles[index].color);
		}
	});

	it("should be deterministic (remove if does not contain existing)", async () => {
		const vehicles = [
			{
				unitId: units[1].id,
				numberPlate: "B1",
				model: "Honda Civic",
				color: "Blue",
			},
		];

		const records = await vehicleQueries.upsertMultiple(units[1].id, vehicles);

		expect(records.length).toBe(1);

		for (const [index, record] of records.entries()) {
			expect(record).toHaveProperty("unitId", vehicles[index].unitId);
			expect(record).toHaveProperty("numberPlate", vehicles[index].numberPlate);
			expect(record).toHaveProperty("model", vehicles[index].model);
			expect(record).toHaveProperty("color", vehicles[index].color);
		}
	});

	it("should be deterministic (remove all if empty array is given)", async () => {
		const vehicles: any[] = [];

		const records = await vehicleQueries.upsertMultiple(units[1].id, vehicles);

		expect(records.length).toBe(0);
	});

	it("should get all by units", async () => {
		const records = await vehicleQueries.getAllByUnit("A-01-01");

		expect(records.length).toBe(2);

		for (const [index, record] of records.entries()) {
			if (index === 0) {
				expect(record).toHaveProperty("id", temp.vehicles[index].id);
			}
			expect(record).toHaveProperty("unitId", temp.vehicles[index].unitId);
			expect(record).toHaveProperty(
				"numberPlate",
				temp.vehicles[index].numberPlate,
			);
			expect(record).toHaveProperty("model", temp.vehicles[index].model);
			expect(record).toHaveProperty("color", temp.vehicles[index].color);
			expect(record).toHaveProperty(
				"createdAt",
				temp.vehicles[index].createdAt,
			);
			expect(record).toHaveProperty(
				"updatedAt",
				temp.vehicles[index].updatedAt,
			);
		}
	});
});
