import { getRequestHeaders } from "h3";
import type { UseFetchOptions } from "nuxt/app";
import type { NuxtError } from "#app";

/**
 * A custom wrapper for fetch with 100% compatible with global $fetch.
 * The wrapper handles error response by triggering a toast. When it receives
 * a http code 401 error, it automatically redirects user to `/auth/login`.
 * This reduces boilerplate codes to handle error response separately.
 * @note Available only as a composable, do not use outside of Nuxt context.
 */
export const $api = $fetch.create({
	/**
	 * By default, during Nuxt SSR, headers are not forwarded to api as these
	 * are considerred internal api call. This can caused authenticated request
	 * become unauthenticated as the required auth headers are not being forwarded
	 * to api handler.
	 *
	 * Below is reimplementation of a part of useRequestFetch() from nuxt, to
	 * forward the necessary origin request headers to api handler.
	 *
	 * @see {@link{https://github.com/nuxt/nuxt/blob/main/packages/nuxt/src/app/composables/ssr.ts}}
	 */
	onRequest: async ({ options }) => {
		if (import.meta.server) {
			const event = useNuxtApp().ssrContext?.event;
			const _headers = event ? getRequestHeaders(event) : {};
			await Promise.allSettled(
				Object.keys(_headers).map(async (key) => {
					if (_headers[key]) {
						options.headers.set(key, _headers[key]);
					}
				}),
			);
		}
	},
	onResponseError: async ({ response, error }): Promise<void> => {
		const data = response._data as NuxtError<{
			message: string;
			statusMessage: string;
			data: unknown;
		}>;

		const unauthenticated = response.status === 401;

		useToast().add({
			icon: "lucide:circle-alert",
			title: data?.statusMessage,
			description:
				data?.message || (error as Error)?.message || "An error occurred",
			color: unauthenticated ? "warning" : "error",
		});

		if (unauthenticated) {
			const { clear } = useUserSession();
			await clear();
			await navigateTo("/auth/login");
		}
	},
});

/**
 * A custom wrapper for useFetch() with 100% compatibliity.
 * The wrapper handles error response by triggering a toast. When it receives
 * a http code 401 error, it automatically redirects user to `/auth/login`.
 * This reduces boilerplate codes to handle error response separately.
 * @note Available only as a composable, do not use outside of Nuxt context.
 */
export const useAPI: typeof useFetch = <T>(
	url: string | (() => string),
	opts: UseFetchOptions<T> = {},
) => {
	return useFetch(url, {
		...opts,
		$fetch: $api as typeof $fetch,
	});
};
