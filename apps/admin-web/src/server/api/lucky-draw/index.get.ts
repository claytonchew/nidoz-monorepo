import * as z from "zod";

export default defineAPIEventHandler(async (event) => {
	const { id } = await getValidatedQuery(
		event,
		z.object({
			id: z.string().min(1),
		}).parse,
	);

	const record = await luckyDrawQueries.getWithEntriesCount(id);

	if (!record) {
		throw createError({
			statusCode: 404,
			statusMessage: "Not Found",
			message: `Lucky Draw with id ${id} not found`,
		});
	}

	return record;
});
