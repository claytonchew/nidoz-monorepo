export default defineAPIEventHandler(async (event, { t }) => {
	const session = await getUserSession(event);

	if (!session || !Object.keys(session).length || !session.user) {
		return false;
	}

	const user = await adminService.get(session.user.id);

	if (!user) {
		await clearUserSession(event);
		setGlobalToast(event, {
			title: t("YouHaveBeenLoggedOut"),
			color: "warning",
			redirectTo: "/auth/login",
		});
		return false;
	}

	if (user.status !== $schema.AdminStatus.Active) {
		await clearUserSession(event);
		setGlobalToast(event, {
			title: t("YouHaveBeenLoggedOut"),
			color: "warning",
			redirectTo: "/auth/login",
		});
		return false;
	}

	const newSession = await setCurrentUserSession(event, user);

	return { ...session, ...newSession, id: session.id, secure: undefined };
});
