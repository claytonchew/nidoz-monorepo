import * as z from "zod";

export default defineAPIEventHandler(async (event) => {
	const {
		page,
		pageSize,
		search,
		filterBlock,
		filterFloor,
		filterNumber,
		sort,
	} = await getValidatedQuery(
		event,
		z.object({
			page: z.coerce.number().optional().default(1),
			pageSize: z.coerce.number().optional().default(30),
			search: z
				.string()
				.transform((val) => (val === "" ? undefined : val))
				.optional(),
			filterBlock: z
				.string()
				.transform((val) => (val === "" ? undefined : val))
				.optional(),
			filterFloor: z
				.string()
				.transform((val) => (val === "" ? undefined : val))
				.optional(),
			filterNumber: z
				.string()
				.transform((val) => (val === "" ? undefined : val))
				.optional(),
			sort: z.enum(["asc", "desc"]).default("asc"),
		}).parse,
	);

	const filters =
		filterBlock || filterFloor || filterNumber
			? {
					block: filterBlock,
					floor: filterFloor,
					number: filterNumber,
				}
			: undefined;

	return await unitQueries.getAll({
		page,
		pageSize,
		search,
		filters,
		sort,
	});
});
