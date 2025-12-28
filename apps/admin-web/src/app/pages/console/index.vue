<template>
	<UDashboardPanel id="home">
		<template #header>
			<UDashboardNavbar title="Home" :ui="{right: 'gap-3'}">
				<template #leading>
					<UDashboardSidebarCollapse/>
				</template>
			</UDashboardNavbar>

			<UDashboardToolbar>
				<template #left>Left Buttons</template>
			</UDashboardToolbar>
		</template>

		<template #body>Home</template>
	</UDashboardPanel>
</template>

<script setup lang="ts">
definePageMeta({
	alias: "/",
});

useSeoMeta({
	title: $t("Home"),
});
</script>
