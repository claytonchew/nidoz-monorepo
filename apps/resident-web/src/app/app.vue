<template>
	<UApp>
		<NuxtLoadingIndicator/>

		<NuxtLayout>
			<NuxtPage/>
		</NuxtLayout>
	</UApp>
</template>

<script setup lang="ts">
const colorMode = useColorMode();
const appConfig = useAppConfig();
const color = computed(() => {
	switch (colorMode.value) {
		case "dark":
			switch (appConfig.ui.colors.neutral) {
				case "slate":
					return "#020617";
				case "gray":
					return "#030712";
				case "zinc":
					return "#09090b";
				case "neutral":
					return "#0a0a0a";
				case "stone":
					return "#0c0a09";
				default:
					return "#0a0a0a";
			}

		case "light":
			return "white";
		default:
			return "white";
	}
});

useHead({
	meta: [
		{ charset: "utf-8" },
		{
			name: "viewport",
			content: "width=device-width, initial-scale=1, maximum-scale=1",
		},
		{ key: "theme-color", name: "theme-color", content: color },
	],
	link: [
		{
			rel: "icon",
			type: "image/png",
			href: "/favicon-96x96.png",
			sizes: "96x96",
		},
		{ rel: "shortcut icon", href: "/favicon.ico" },
		{
			rel: "apple-touch-icon",
			sizes: "180x180",
			href: "/apple-touch-icon.png",
		},
		{ rel: "manifest", href: "/site.webmanifest" },
	],
	htmlAttrs: {
		lang: "en",
	},
});

const titleTemplate = "%s - Nidoz Space";
const title = "Nidoz Space";
const description =
	"Nidoz space is a community platform for residents of Nidoz Residences.";

useSeoMeta({
	titleTemplate,
	title,
	description,
	ogTitle: title,
	ogDescription: description,
});

onMounted(() => {
	// listen to any global error
	useGlobalToast().listen();
});
</script>
