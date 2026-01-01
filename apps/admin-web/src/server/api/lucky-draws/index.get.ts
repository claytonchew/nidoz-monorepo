import * as z from "zod";

export default defineAPIEventHandler(async (event) => {
	const { page, pageSize, search, sort } = await getValidatedQuery(
		event,
		z.object({
			page: z.coerce.number().optional().default(1),
			pageSize: z.coerce.number().optional().default(30),
			search: z
				.string()
				.transform((val) => (val === "" ? undefined : val))
				.optional(),
			sort: z.enum(["asc", "desc"]).default("desc"),
		}).parse,
	);

	return await luckyDrawQueries.getAll({
		page,
		pageSize,
		search,
		sort,
	});
});
