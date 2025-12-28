import type { H3Event } from "h3";
import type { ToastProps } from "#ui/types";

export const setGlobalToast = (
	event: H3Event,
	{
		title,
		description,
		icon,
		color,
		redirectTo,
	}: {
		title?: string;
		description?: string;
		icon?: string;
		color?: ToastProps["color"];
		redirectTo?: string;
	},
) => {
	setCookie(
		event,
		"gt",
		JSON.stringify({
			t: title,
			d: description,
			i: icon,
			c: color,
			r: redirectTo,
		}),
	);
};
