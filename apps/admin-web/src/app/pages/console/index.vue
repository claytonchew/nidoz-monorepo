<template>
	<UDashboardPanel id="home">
		<template #header>
			<UDashboardNavbar title="Home" :ui="{right: 'gap-3'}">
				<template #leading>
					<UDashboardSidebarCollapse/>
				</template>
			</UDashboardNavbar>
		</template>

		<template #body>
			<span class="text-dimmed">Coming soon...</span>
		</template>
	</UDashboardPanel>
</template>

<script setup lang="ts">
definePageMeta({
	alias: "/",
});

useSeoMeta({
	title: "Home",
});
</script>
