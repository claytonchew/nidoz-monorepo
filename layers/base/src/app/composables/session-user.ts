/**
 * Custom composable to manage user session, apart from useUserSession().
 * Because `useUserSession()` is already defined for nuxt-auth-utils, so we define
 * `userSessionUser()` instead :(
 *
 * API is 100% compatible with useUserSession(), so you can use it directly.
 */
export const useSessionUser = () => {
	const sessionState = useState("nuxt-session");
	/**
	 * Force refresh session by checking the user against the database.
	 * @returns session if logged in user is authenticated
	 */
	const refresh = async () => {
		sessionState.value = await $api("/api/auth/refresh", {
			headers: { accept: "application/json" },
			retry: false,
		}).catch(() => {});
	};

	return {
		refresh,
		...useUserSession(),
	};
};
