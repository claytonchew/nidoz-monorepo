<template>
	<UDashboardPanel id="lucky-draws">
		<template #header>
			<UDashboardNavbar title="Lucky Draws" :ui="{right: 'gap-3'}">
				<template #leading>
					<UDashboardSidebarCollapse/>
				</template>
			</UDashboardNavbar>

			<UDashboardToolbar>
				<template #left>
					<div class="w-full">
						<UInput
							v-model="search"
							class="w-full"
							icon="lucide:search"
							placeholder="Search..."
							variant="none"
							:highlight="Boolean(search)"
						/>
					</div>
				</template>
				<template #right>
					<UButton
						label="Create Lucky Draw"
						icon="lucide:plus"
						color="neutral"
						variant="ghost"
						@click="() => {
							modalLuckyDraw.open({
								onRefresh: () => {
									refresh();
								},
							});
						}"
					/>
				</template>
			</UDashboardToolbar>
		</template>

		<template #body>
			<TableLuckyDraws
				v-if="tableVisibility"
				:data="records"
				:get-action-items="getActionItems"
				:loading="status === 'pending'"
				@update:sort="onSort"
				@refresh="refresh"
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
import { LazyModalLuckyDraw, LazySlideoverLuckyDrawEntries } from "#components";

useSeoMeta({
	title: "Lucky Draws",
});

const page = ref(1);
const pageSize = ref(30);
const sort = ref<"asc" | "desc">("desc");

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

const { data, status, refresh } = useAPI("/api/lucky-draws", {
	method: "GET",
	query: {
		page: page,
		pageSize: pageSize,
		sort: sort,
		search: debouncedSearch,
	},
});

const overlay = useOverlay();
const modalLuckyDraw = overlay.create(LazyModalLuckyDraw);
const modalLuckyDrawEntries = overlay.create(LazySlideoverLuckyDrawEntries);

const tableVisibility = ref(true);
const refreshTable = () => {
	tableVisibility.value = false;
	nextTick(() => {
		tableVisibility.value = true;
	});
};
const records = computed(() => data.value?.records ?? []);
whenever(data, () => {
	refreshTable();
});
watchEffect(() => {
	total.value = data.value?.totalCount ?? 0;
});

const getActionItems = computed(
	() =>
		(
			row: Row<APIResponse<"/api/lucky-draws", "get">["records"][number]>,
		): DropdownMenuProps["items"] => {
			return [
				{
					type: "label",
					label: "Actions",
				},
				{
					label: "View Entries",
					icon: "lucide:users",
					onSelect: async () => {
						modalLuckyDrawEntries.open({
							id: row.original.id,
						});
					},
				},
				{
					type: "separator",
				},
				{
					label: "Delete",
					icon: "lucide:trash-2",
					color: "error",
					onSelect: async () => {
						await $api("/api/lucky-draw", {
							method: "DELETE",
							query: { id: row.original.id },
						});
						useToast().add({
							title: "Successful",
							description: "Lucky draw deleted successfully.",
							color: "success",
						});
						refresh();
					},
				},
			];
		},
);

const onSort = (sortEmit: { id: string; desc: boolean }[]) => {
	const sortItem = sortEmit.find((s) => s.id === "createdAt");
	if (sortItem) {
		sort.value = sortItem.desc ? "desc" : "asc";
	} else {
		sort.value = "asc";
	}
};
</script>
