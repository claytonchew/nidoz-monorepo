import type { H3Event } from "h3";

export const sanitizeUser = (user: typeof $schema.admin.$inferSelect) => {
	return {
		id: user.id,
		name: user.name,
		email: user.email,
	};
};

export const setCurrentUserSession = async (
	event: H3Event,
	user: typeof $schema.admin.$inferSelect,
) => {
	const transformedUser = sanitizeUser(user);
	const session = await replaceUserSession(event, { user: transformedUser });
	return session;
};
