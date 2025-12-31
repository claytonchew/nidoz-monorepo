import * as z from "zod";

export default defineAPIEventHandler(async (event, { t }) => {
	const { token: twoken, type } = await getValidatedQuery(
		event,
		async (params) => {
			const { success, data } = z
				.object({ token: z.string().min(1), type: z.enum(["v"]) })
				.safeParse(params);

			if (!success) {
				throw createError({
					statusCode: 400,
					statusMessage: t("InvalidX", { field: t("Link") }),
					message: t("InvalidLinkMessage"),
				});
			}

			return data;
		},
	);

	const { cookie_only } = getQuery(event);

	const { 0: unitId, 1: token, length: parts } = twoken.split(":");

	if (parts !== 2) {
		throw createError({
			statusCode: 400,
			statusMessage: t("InvalidX", { field: t("Link") }),
			message: t("InvalidLinkMessage"),
		});
	}

	switch (type) {
		// vehicle management
		case "v": {
			const { result, record: otp } =
				await unitOTPQueries.verifyVehicleManagement({ unitId, token }, false);

			if (!result || !otp) {
				throw createError({
					statusCode: 400,
					statusMessage: t("InvalidX", { field: t("Link") }),
					message: t("InvalidLinkMessage"),
				});
			}

			const unitRecord = await unitQueries.get(otp!.unitId!);

			if (!unitRecord) {
				throw createError({
					statusCode: 400,
					statusMessage: t("InvalidX", { field: t("Link") }),
					message: t("InvalidLinkMessage"),
				});
			}

			setCookie(event, "vt", twoken, {
				httpOnly: true,
				secure: import.meta.dev ? false : true,
			});
			setCookie(
				event,
				"vu",
				`${unitRecord.block}-${unitRecord.floor}-${unitRecord.number}`,
				{
					httpOnly: true,
					secure: import.meta.dev ? false : true,
				},
			);

			// ?cookie_only=true
			if (import.meta.dev && cookie_only) {
				return sendNoContent(event);
			}

			return sendRedirect(event, `/one-time/vehicle-management`);
		}
		default: {
			throw createError({
				statusCode: 400,
				statusMessage: t("InvalidX", { field: t("Link") }),
				message: t("InvalidLinkMessage"),
			});
		}
	}
});
