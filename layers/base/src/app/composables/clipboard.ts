import { useClipboard } from "@vueuse/core";
import { defu } from "defu";
import type { ToastProps } from "#ui/types";

type UseCopyOptions = {
	success?: {
		color?: ToastProps["color"];
		icon?: string;
		title?: string;
		description?: string;
	};
	failure?: {
		color?: ToastProps["color"];
		icon?: string;
		title?: string;
		description?: string;
	};
	timeout?: number;
	position?: string;
};

type UseCopySuccess = {
	title?: string;
	description?: string;
};

type UseCopyFailure = {
	title?: string;
	description?: string;
};

export function useCopy(options: UseCopyOptions = {}) {
	options = defu(options, {
		success: {
			color: "success" as const,
			icon: "lucide:check-circle",
			title: "Copied to clipboard",
		},
		failure: {
			color: "error" as const,
			icon: "lucide:alert-circle",
			title: "Copy failed",
		},
	});
	const { copy: copyToClipboard, isSupported, copied } = useClipboard();
	const toast = useToast();
	function copy(
		text?: string | null,
		success: UseCopySuccess = {},
		failure: UseCopyFailure = {},
	) {
		if (!text) return;
		if (!isSupported) {
			return;
		}
		copyToClipboard(text).then(
			() => {
				toast.add({ ...options.success, ...success });
			},
			(e) => {
				toast.add({
					...options.failure,
					...failure,
					description: failure.description || e.message,
				});
			},
		);
	}
	return {
		copy,
		copied,
	};
}
