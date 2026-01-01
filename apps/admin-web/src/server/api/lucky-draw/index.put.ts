import * as z from "zod";

export default defineAPIEventHandler(async (event) => {
	const data = await readValidatedBody(
		event,
		z.object({
			name: z.string().min(1),
		}).parse,
	);

	const record = await luckyDrawQueries.create(data);

	return record;
});
