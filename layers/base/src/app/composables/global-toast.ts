import type { ToastProps } from "#ui/types";

/**
 * A global toast composable enabling server to trigger toast, whenever required.
 * Recommended to invoke its listener (on mounted) inside of app.vue within the script setup.
 * @example onMounted(() => useGlobalToast().listen())
 */
export const useGlobalToast = () => {
	const _toastCookie = useCookie<{
		c?: ToastProps["color"];
		t?: string;
		d?: string;
		i?: string;
		r?: string;
	} | null>("gt");

	const { t: $t } = useI18n();

	const listen = () =>
		watchEffect(() => {
			if (_toastCookie.value) {
				if (_toastCookie.value.t || _toastCookie.value.d) {
					useToast().add({
						color: _toastCookie.value.c,
						icon: _toastCookie.value.i
							? _toastCookie.value.i
							: "ph:info-duotone",
						title: _toastCookie.value.t ? $t(_toastCookie.value.t) : undefined,
						description: _toastCookie.value.d
							? $t(_toastCookie.value.d)
							: undefined,
					});
				}
				const redirectTo = _toastCookie.value.r;
				_toastCookie.value = null;
				if (redirectTo) {
					navigateTo(redirectTo);
				}
			}
		});

	return {
		listen,
	};
};
