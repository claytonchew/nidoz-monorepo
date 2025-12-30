import * as z from "zod";

export default defineAPIEventHandler(async (event) => {
	const { unit } = await getValidatedQuery(
		event,
		z.object({
			unit: z.string().min(1),
		}).parse,
	);

	const [unitData, vehicleManagementLink] = await Promise.all([
		unitQueries.getByUnit(unit),
		vehicleQueries.getVehicleManagementLink(unit),
	]);

	return {
		unit: unitData,
		link: vehicleManagementLink,
	};
});
