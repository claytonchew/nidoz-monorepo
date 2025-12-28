export default defineNuxtRouteMiddleware(async () => {
	const { loggedIn } = useSessionUser();
	if (!loggedIn.value) return navigateTo("/auth/login");
});
