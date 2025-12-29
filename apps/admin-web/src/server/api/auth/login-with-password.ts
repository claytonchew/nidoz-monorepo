import * as z from "zod";

async function handleUserValidation(
	email: string,
	password: string,
	t: Awaited<ReturnType<typeof useTranslation>>,
) {
	const user = await adminQueries.getByEmail(email);

	if (!user) {
		throw createError({
			statusCode: 400,
			statusMessage: t("InvalidCredentials"),
			message: t("PleaseCheckYourEmailAndPasswordAndTryAgain"),
		});
	}

	if (!user.hashedPassword) {
		throw createError({
			statusCode: 400,
			statusMessage: t("InvalidCredentials"),
			message: t("PleaseCheckYourEmailAndPasswordAndTryAgain"),
		});
	}

	const isPasswordCorrect = await verifyPassword(user.hashedPassword, password);
	if (!isPasswordCorrect) {
		throw createError({
			statusCode: 400,
			statusMessage: t("InvalidCredentials"),
			message: t("PleaseCheckYourEmailAndPasswordAndTryAgain"),
		});
	}

	if (user.status !== $schema.AdminStatus.Active) {
		throw createError({
			statusCode: 400,
			statusMessage: t("InvalidCredentials"),
			message: t("PleaseCheckYourEmailAndPasswordAndTryAgain"),
		});
	}

	return user;
}

export default defineAPIEventHandler(async (event, { t }) => {
	const { email, password } = await readValidatedBody(
		event,
		z.object({
			email: z.email(),
			password: z.string(),
		}).parse,
	);

	const user = await handleUserValidation(email, password, t);

	const newSession = await setCurrentUserSession(event, user);

	return { ...newSession, secure: undefined };
});
