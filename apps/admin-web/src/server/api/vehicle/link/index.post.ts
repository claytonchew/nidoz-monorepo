import * as z from "zod";

export default defineAPIEventHandler(async (event) => {
	const { unit } = await getValidatedQuery(
		event,
		z.object({
			unit: z.string().min(1),
		}).parse,
	);

	return await vehicleQueries.createVehicleManagementLink(unit);
});
