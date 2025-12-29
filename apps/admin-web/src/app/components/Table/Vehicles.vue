<template>
	<UTable
		v-model:sorting="sort"
		ref="table"
		class="shrink-0"
		:data="data"
		:columns="columns"
		:loading="loading"
		:ui="{
		base: 'table-fixed border-separate border-spacing-0',
        thead: '[&>tr]:bg-elevated/50 [&>tr]:after:content-none',
        tbody: '[&>tr]:last:[&>td]:border-b-0',
        th: 'py-2 first:rounded-l-lg last:rounded-r-lg border-y border-default first:border-l last:border-r',
        td: 'border-b border-default',
        separator: 'h-0'
	}"
	>
		<template #vehicles-cell="{ row }">
			<UAvatarGroup v-if="row.original.vehicles.length" :max="4">
				<UPopover
					v-for="vehicle of row.original.vehicles"
					:key="vehicle.id"
					mode="hover"
					:content="{side: 'top'}"
					arrow
				>
					<UAvatar :alt="vehicle.numberPlate"/>
					<template #content>
						<UPageCard>
							<div class="flex flex-col gap-1">
								<span class="font-medium"> {{ vehicle.numberPlate }}</span>
								<span>
									<span class="text-sm text-dimmed"> {{ vehicle.model }}</span>
									<span class="text-sm text-dimmed">
										({{ vehicle.color }})
									</span>
								</span>
							</div>
						</UPageCard>
					</template>
				</UPopover>
			</UAvatarGroup>
			<span class="text-dimmed" v-else> No vehicles registered. </span>
		</template>
	</UTable>
</template>

<script setup lang="ts">
import type { DropdownMenuProps, TableColumn } from "#ui/types";
import type { Row } from "@tanstack/vue-table";
import { h, resolveComponent } from "vue";

const UBadge = resolveComponent("UBadge");
const UDropdownMenu = resolveComponent("UDropdownMenu");
const UButton = resolveComponent("UButton");

const props = defineProps<{
	data: APIResponse<"/api/vehicles", "get">["records"];
	loading?: boolean;
	getActionItems: (
		row: Row<APIResponse<"/api/vehicles", "get">["records"][number]>,
	) => DropdownMenuProps["items"];
}>();

const emits = defineEmits<{
	refresh: [];
	"update:sort": [{ id: string; desc: boolean }[]];
}>();

const columns: ComputedRef<
	TableColumn<APIResponse<"/api/vehicles", "get">["records"][number]>[]
> = computed(() => [
	{
		id: "unit",
		header: ({ column }) => {
			const isSorted = column.getIsSorted();

			return h(UButton, {
				color: "neutral",
				variant: "ghost",
				label: "Unit",
				icon: isSorted
					? isSorted === "asc"
						? "i-lucide-arrow-up-narrow-wide"
						: "i-lucide-arrow-down-wide-narrow"
					: "i-lucide-arrow-up-down",
				class: "-mx-2.5",
				onClick: () => {
					column.toggleSorting(column.getIsSorted() === "asc");
					emits("update:sort", sort.value);
				},
			});
		},
		cell: ({ row }) =>
			`${row.original.block}-${row.original.floor}-${row.original.number}`,
	},
	{
		header: "Block",
		accessorKey: "block",
		cell: ({ row }) => {
			return h(
				UBadge,
				{ color: "primary", variant: "outline" },
				() => row.original.block,
			);
		},
	},
	{
		header: "Floor",
		accessorKey: "floor",
		cell: ({ row }) => {
			return h(
				UBadge,
				{ color: "neutral", variant: "outline" },
				() => row.original.floor,
			);
		},
	},
	{
		header: "Unit No.",
		accessorKey: "number",
		cell: ({ row }) => {
			return h(
				UBadge,
				{ color: "neutral", variant: "subtle" },
				() => row.original.number,
			);
		},
	},
	{
		header: "Vehicles",
		accessorKey: "vehicles",
	},
	{
		id: "actions",
		cell: ({ row }) => {
			return h(
				"div",
				{ class: "text-right" },
				h(
					UDropdownMenu,
					{
						content: {
							align: "end",
						},
						items: props.getActionItems(row),
						"aria-label": "Actions dropdown",
					},
					() =>
						h(UButton, {
							icon: "lucide:ellipsis-vertical",
							color: "neutral",
							variant: "ghost",
							class: "ml-auto",
							"aria-label": "Actions dropdown",
						}),
				),
			);
		},
	},
]);

const sort = ref([
	{
		id: "unit",
		desc: false,
	},
]);
</script>
