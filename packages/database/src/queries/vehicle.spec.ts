import { config } from "dotenv";
import { describe, expect, it } from "vitest";
import * as $schema from "../schema";
import { getTestDB } from "../test-utils/get-test-db";
import { UnitQueries } from "./unit";
import { VehicleQueries } from "./vehicle";
import { inArray } from "drizzle-orm";

config({ path: ".env", quiet: true });

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

	it("should create vehicle management link", async () => {
		const link = await vehicleQueries.createVehicleManagementLink(
			`${units[0].block}-${units[0].floor}-${units[0].number}`,
		);

		expect(
			link.url.startsWith(
				`${process.env.NUXT_PUBLIC_NIDOZ_SPACE_VEHICLE_MGMT_BASE_URL}/edit?token=`,
			),
		).toBe(true);
		expect(link.expiresAt).toBeInstanceOf(Date);

		temp.vehicleManagementLink = link;
	});

	it("should revoke previous management link if a new one is generated", async () => {
		const newLink = await vehicleQueries.createVehicleManagementLink(
			`${units[0].block}-${units[0].floor}-${units[0].number}`,
		);

		expect(
			newLink.url.startsWith(
				`${process.env.NUXT_PUBLIC_NIDOZ_SPACE_VEHICLE_MGMT_BASE_URL}/edit?token=`,
			),
		).toBe(true);
		expect(newLink.expiresAt).toBeInstanceOf(Date);
		expect(newLink).not.toStrictEqual(temp.vehicleManagementLink);

		temp.vehicleManagementLink = newLink;
	});

	it("should get the current management link if generated", async () => {
		const link = await vehicleQueries.getVehicleManagementLink(
			`${units[0].block}-${units[0].floor}-${units[0].number}`,
		);

		expect(link).toStrictEqual(temp.vehicleManagementLink);
	});

	it("should get null if management link was not generated prior", async () => {
		const link = await vehicleQueries.getVehicleManagementLink(
			`${units[1].block}-${units[1].floor}-${units[1].number}`,
		);

		expect(link).toBeNull();
	});

	it("should automatically revoke if there exist more than 1 links", async () => {
		// Manually insert duplicate links
		const links = await $db
			.insert($schema.unitOTP)
			.values([
				{
					id: "link1",
					type: $schema.UnitOTPType.VehicleManagement,
					unitId: units[1].id,
					code: "11111111",
					token: "LINKA",
					expiresAt: new Date(Date.now() + 1000 * 60 * 60),
					revokedAt: null,
					revokedReason: null,
				},
				{
					id: "link2",
					type: $schema.UnitOTPType.VehicleManagement,
					unitId: units[1].id,
					code: "22222222",
					token: "LINKB",
					expiresAt: new Date(Date.now() + 1000 * 60 * 60),
					revokedAt: null,
					revokedReason: null,
				},
			])
			.returning();

		const result = await vehicleQueries.getVehicleManagementLink(
			`${units[1].block}-${units[1].floor}-${units[1].number}`,
		);

		expect(result).toBeNull();

		const checkLinks = await $db
			.select()
			.from($schema.unitOTP)
			.where(inArray($schema.unitOTP.id, [links[0].id, links[1].id]));

		for (const link of checkLinks) {
			expect(link.revokedAt).not.toBeNull();
		}
	});
});
