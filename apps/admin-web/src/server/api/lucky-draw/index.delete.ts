import * as z from "zod";

export default defineAPIEventHandler(async (event) => {
	const { id } = await getValidatedQuery(
		event,
		z.object({
			id: z.string().min(1),
		}).parse,
	);

	await luckyDrawQueries.remove(id);

	return "OK";
});
