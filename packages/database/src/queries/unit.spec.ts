import { and, eq, ne } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import insertUnits from "../../seed/jobs/insert-units";
import { defineSeedConfig } from "../module/seed";
import * as $schema from "../schema";
import { getTestDB } from "../test-utils/get-test-db";
import { UnitOTPQueries, UnitQueries } from "./unit";
import { VehicleQueries } from "./vehicle";

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
	const vehicleQueries = new VehicleQueries($db);

	it("should get unit by unit string", async () => {
		const unit = await unitQueries.getByUnit("A-32-05");
		expect(unit).not.toBeNull();
	});

	it("should get all units", async () => {
		const units = await unitQueries.getAll({ page: 1, pageSize: 100 });
		expect(units.records.length).toBe(100);
	});

	it("should get units (each with vehicles information)", async () => {
		const unitRecord = await unitQueries.getByUnit("A-17-3A");
		const vehiclesData = await vehicleQueries.upsertMultiple([
			{
				unitId: unitRecord!.id,
				numberPlate: "A1",
				model: "Toyota Vios",
				color: "White",
			},
			{
				unitId: unitRecord!.id,
				numberPlate: "A2",
				model: "Toyota City",
				color: "Black",
			},
		]);

		const units = await unitQueries.getAll({
			filters: { block: "A", floor: "17", number: "3A" },
		});
		const vehiclesRecord = units.records[0].vehicles;

		for (let i = 0; i < vehiclesData.length; i++) {
			expect(vehiclesRecord[i]).toHaveProperty("id", vehiclesData[i].id);
			expect(vehiclesRecord[i]).toHaveProperty(
				"numberPlate",
				vehiclesData[i].numberPlate,
			);
			expect(vehiclesRecord[i]).toHaveProperty("model", vehiclesData[i].model);
			expect(vehiclesRecord[i]).toHaveProperty("color", vehiclesData[i].color);
		}
	});
});

describe("UnitOTPQueries", async () => {
	const { $db } = await getTestDB();
	const unitQueries = new UnitQueries($db);
	const unitOTPQueries = new UnitOTPQueries($db);

	const temp: Record<string, any> = {};

	const unit = await unitQueries.create({
		id: "A-01-01",
		block: "A",
		floor: "01",
		number: "01",
	});

	it("should generate new unit vehicle management OTP (using id)", async () => {
		const record = await unitOTPQueries.generateVehicleManagement({
			unitId: unit.id,
		});

		expect(record).toHaveProperty("unitId", unit.id);
		expect(record.type).toBe($schema.UnitOTPType.VehicleManagement);
		expect(record.code).not.toBeNull();
		expect(record.token).not.toBeNull();
	});

	it("should update existing unit vehicle management OTP", async () => {
		const record = await unitOTPQueries.updateVehicleManagement(
			{ verifier: { unitId: unit.id } },
			{
				token: "ABC",
			},
		);

		expect(record).toHaveProperty("token", "ABC");
	});

	it("should revoke old unit vehicle management OTP if new one is generated", async () => {
		const record = await unitOTPQueries.generateVehicleManagement({
			unitId: unit.id,
		});

		const check = await $db
			.select()
			.from($schema.unitOTP)
			.where(and(ne($schema.unitOTP.id, record.id)));
		for (const otp of check) {
			expect(otp.revokedAt).not.toBeNull();
		}

		// store for next test
		temp.otpToVerify = record;
	});

	it("should verify OTP without revoking if such opt is passed in", async () => {
		const { unitId, token } = temp.otpToVerify;
		const verify = await unitOTPQueries.verifyVehicleManagement(
			{ unitId, token },
			false,
		);

		expect(verify.result).toBe(true);

		const check = await $db
			.select()
			.from($schema.unitOTP)
			.where(eq($schema.unitOTP.id, temp.otpToVerify.id));
		expect(check[0].revokedAt).toBeNull();
	});

	it("should verify OTP and revoke it at the same time by default", async () => {
		const { unitId, token } = temp.otpToVerify;
		const verify = await unitOTPQueries.verifyVehicleManagement({
			unitId,
			token,
		});

		expect(verify.result).toBe(true);

		const check = await $db
			.select()
			.from($schema.unitOTP)
			.where(eq($schema.unitOTP.id, temp.otpToVerify.id));
		expect(check[0].revokedAt).not.toBeNull();
	});
});
