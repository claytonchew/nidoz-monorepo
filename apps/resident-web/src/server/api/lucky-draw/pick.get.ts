import * as z from "zod";

export default defineAPIEventHandler(async (event, { t }) => {
	const { id } = await getValidatedQuery(
		event,
		z.object({
			id: z.string().min(1),
		}).parse,
	);

	const record = await luckyDrawQueries.pickRandomFromEntries(id);

	return record;
});
