<template>
	<UDashboardPanel id="vehicles">
		<template #header>
			<UDashboardNavbar title="Vehicles" :ui="{right: 'gap-3'}">
				<template #leading>
					<UDashboardSidebarCollapse/>
				</template>
			</UDashboardNavbar>

			<UDashboardToolbar>
				<template #left>
					<UInput
						v-model="search"
						class="max-w-sm"
						icon="lucide:search"
						placeholder="e.g. A-08-01 or A0801"
						variant="none"
						:highlight="Boolean(search)"
					/>
				</template>
			</UDashboardToolbar>
		</template>

		<template #body>
			<TableVehicles
				:data="records"
				:get-action-items="getActionItems"
				:loading="status === 'pending'"
				@update:sort="onSort"
			/>

			<div
				class="flex items-center justify-between gap-3 border-t border-default pt-4 mt-auto"
			>
				<div class="text-sm text-muted">{{ paginationLabel }}</div>
				<div class="flex items-center gap-1.5">
					<UPagination
						v-model:page="page"
						:items-per-page="pageSize"
						:total="total"
						show-edges
					/>
				</div>
			</div>
		</template>
	</UDashboardPanel>
</template>

<script setup lang="ts">
import type { Row } from "@tanstack/vue-table";
import type { DropdownMenuProps } from "#ui/types";

useSeoMeta({
	title: "Vehicles",
});

const page = ref(1);
const pageSize = ref(30);
const sort = ref<"asc" | "desc">("asc");

const search = ref<string>("");
const debouncedSearch = refDebounced(search, 350);

watch([debouncedSearch], () => {
	page.value = 1;
});

const total = ref(0);
const paginationLabel = computed(() => {
	const start = (page.value - 1) * pageSize.value + 1;
	const end = Math.min(page.value * pageSize.value, total.value);
	return `Showing ${start} to ${end} of ${total.value} records.`;
});

const { data, status, refresh } = useAPI("/api/vehicles", {
	method: "GET",
	query: {
		page: page,
		pageSize: pageSize,
		sort: sort,
		search: debouncedSearch,
	},
});

const records = computed(() => data.value?.records ?? []);
watchEffect(() => {
	total.value = data.value?.totalCount ?? 0;
});

const getActionItems = computed(
	() =>
		(
			row: Row<APIResponse<"/api/vehicles", "get">["records"][number]>,
		): DropdownMenuProps["items"] => {
			return [
				{
					type: "label",
					label: "Actions",
				},
				{
					label: "Edit Vehicles",
					icon: "lucide:car-front",
				},
				{
					type: "separator",
				},
				{
					label: "Send Link",
					icon: "lucide:link-2",
				},
			];
		},
);

const onSort = (sortEmit: { id: string; desc: boolean }[]) => {
	const sortItem = sortEmit.find((s) => s.id === "unit");
	if (sortItem) {
		sort.value = sortItem.desc ? "desc" : "asc";
	} else {
		sort.value = "asc";
	}
};
</script>
