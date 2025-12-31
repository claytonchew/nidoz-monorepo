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

	const [unitData, vehiclesData] = await Promise.all([
		unitQueries.get(unitId),
		vehicleQueries.getAllByUnitId(unitId),
	]);

	return {
		unit: unitData as typeof $schema.unit.$inferSelect,
		vehicles: vehiclesData,
	};
});
