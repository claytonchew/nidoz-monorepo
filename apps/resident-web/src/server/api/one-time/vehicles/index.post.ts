import * as z from "zod";

export default defineAPIEventHandler(async (event, { t }) => {
	const twoken = getCookie(event, "vt");
	if (!twoken) {
		throw createError({
			statusCode: 403,
			statusMessage: t("Unauthorized"),
		});
	}

	const { 0: unitId, 1: token, length: parts } = twoken.split(":");

	if (parts !== 2) {
		throw createError({
			statusCode: 403,
			statusMessage: t("Unauthorized"),
		});
	}

	const { result, record } = await unitOTPQueries.verifyVehicleManagement(
		{ unitId, token },
		false,
	);

	if (!result || !record) {
		throw createError({
			statusCode: 403,
			statusMessage: t("Unauthorized"),
		});
	}
	if (!unitId || !token) {
		throw createError({
			statusCode: 403,
			statusMessage: t("Unauthorized"),
		});
	}
	const { vehicles } = await readValidatedBody(
		event,
		z.object({
			vehicles: z.array(
				z.object({
					id: z.string().optional(),
					createdAt: z
						.string()
						.transform((val) => new Date(val))
						.or(z.date())
						.optional(),
					updatedAt: z
						.string()
						.transform((val) => new Date(val))
						.or(z.date())
						.optional(),
					numberPlate: z.string().min(1),
					model: z.string().min(1),
					color: z.string().min(1),
				}),
			),
		}).parse,
	);

	const unitRecord = await unitQueries.get(unitId);
	if (!unitRecord) {
		throw createError({
			statusCode: 404,
			statusMessage: "Not Found",
			message: `Unit not found`,
		});
	}

	// just to set up the type guard (won't happen in practice)
	if (Array.isArray(unitRecord)) {
		throw createError({
			statusCode: 500,
			statusMessage: "Internal Server Error",
			message: `Expected unit record to be a single object`,
		});
	}

	const records = await useDB().transaction(async (tx) => {
		const results = await vehicleQueries.upsertMultiple(
			unitRecord.id,
			vehicles.map((v) => ({
				...v,
				unitId: unitRecord.id,
			})),
			tx,
		);

		// revoke the one-time token after use
		const { result } = await unitOTPQueries.verifyVehicleManagement(
			{ unitId, token },
			true,
			tx,
		);

		if (!result) {
			throw createError({
				statusCode: 403,
				statusMessage: t("Unauthorized"),
			});
		}

		// clear the one-time cookies after use
		deleteCookie(event, "vt");
		deleteCookie(event, "vu");

		return results;
	});

	return records;
});
