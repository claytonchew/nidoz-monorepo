import * as z from "zod";

export default defineAPIEventHandler(async (event) => {
	const { id } = await getValidatedQuery(
		event,
		z.object({
			id: z.string().min(1),
		}).parse,
	);
	const data = await readValidatedBody(
		event,
		z.object({
			name: z.string().min(1),
		}).parse,
	);

	const record = await luckyDrawQueries.update(id, data);

	return record;
});
