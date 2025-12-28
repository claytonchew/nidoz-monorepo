<template>
	<UDashboardGroup unit="rem">
		<UDashboardSidebar
			id="default"
			v-model:open="open"
			collapsible
			resizable
			class="bg-elevated/25"
			:ui="{ footer: 'lg:border-t lg:border-default' }"
		>
			<template #header="{ collapsed }">
				<NuxtLink to="/" class="flex items-center gap-2 w-full">
					<AppLogo class="mx-auto h-6 w-auto"/>
				</NuxtLink>
			</template>

			<template #default="{ collapsed }">
				<UDashboardSearchButton
					:collapsed="collapsed"
					class="bg-transparent ring-default"
				/>

				<UNavigationMenu
					:collapsed="collapsed"
					:items="links[0]"
					orientation="vertical"
					tooltip
					popover
				/>
			</template>

			<template #footer="{ collapsed }">
				<UserMenu :collapsed="collapsed"/>
			</template>
		</UDashboardSidebar>

		<UDashboardSearch :groups="groups"/>

		<slot/>
	</UDashboardGroup>
</template>

<script setup>
const { links, groups, open } = useConsole();
</script>
