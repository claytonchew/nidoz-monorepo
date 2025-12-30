import * as z from "zod";

export default defineAPIEventHandler(async (event) => {
	const { unit } = await getValidatedQuery(
		event,
		z.object({
			unit: z.string().min(1),
		}).parse,
	);
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

	const unitRecord = await unitQueries.getByUnit(unit);
	if (!unitRecord) {
		throw createError({
			statusCode: 404,
			statusMessage: "Not Found",
			message: `Unit ${unit} not found`,
		});
	}

	return await vehicleQueries.upsertMultiple(
		unitRecord.id,
		vehicles.map((v) => ({
			...v,
			unitId: unitRecord.id,
		})),
	);
});
