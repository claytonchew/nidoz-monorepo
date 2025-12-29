import { isMatch } from "matcher";

export default defineAPIEventHandler(async (event, { t }) => {
	if (event.path.startsWith("/api")) {
		// requires no authentication and authorization
		if (isMatch(event.path, ["/api/auth*", "/api/_*"])) {
			return;
		}

		await requireUserSession(event);
	}
});
