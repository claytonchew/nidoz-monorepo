import type { NavigationMenuItem } from "@nuxt/ui";

export const useConsole = () => {
	const open = ref(false);

	const links = [
		[
			{
				label: "Home",
				icon: "lucide:home",
				to: "/",
				onSelect: () => {
					open.value = false;
				},
			},
			{
				label: "Vehicles",
				icon: "lucide:car-front",
				to: "/vehicles",
				onSelect: () => {
					open.value = false;
				},
			},
		],
	] satisfies NavigationMenuItem[][];

	const groups = computed(() => [
		{
			id: "links",
			label: "Go to",
			items: links.flat(),
		},
	]);

	return {
		open,
		links,
		groups,
	};
};
