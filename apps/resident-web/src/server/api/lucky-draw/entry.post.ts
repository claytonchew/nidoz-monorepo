import type { ResidentialUnit } from "@nidoz/utils";
import * as z from "zod";

export default defineAPIEventHandler(async (event, { t }) => {
	const { id } = await getValidatedQuery(
		event,
		z.object({
			id: z.string().min(1),
		}).parse,
	);

	const data = await readValidatedBody(
		event,
		z.object({
			unit: z
				.string(t("CannotBeEmpty"))
				.min(1, t("CannotBeEmpty"))
				.refine(
					(val) => {
						try {
							parseResidentialUnit(val.trim());
							return true;
						} catch (error) {
							return false;
						}
					},
					{ error: t("InvalidX", { field: t("UnitNumber") }) },
				),
			name: z.string(t("CannotBeEmpty")).min(1, t("CannotBeEmpty")),
			email: z.preprocess((val) => {
				if (typeof val === "string") {
					if (val.trim() === "") {
						return undefined;
					} else {
						return val;
					}
				}
				return undefined;
			}, z.email({ error: t("InvalidX", { field: t("Email") }) }).optional()),
			phoneNumber: z
				.string()
				.transform((val) => (val.trim() === "" ? undefined : val))
				.optional(),
		}).parse,
	);

	const unitRecord = await unitQueries.getByUnit(data.unit);

	if (!unitRecord) {
		throw createError({
			statusCode: 400,
			statusMessage: t("InvalidX", { field: t("Unit") }),
			message: t("PleaseEnsureYouEnteredValidUnitNumber"),
		});
	}

	await luckyDrawQueries.createEntry({
		...data,
		unitId: unitRecord.id,
		luckyDrawId: id,
	});

	return "OK";
});
