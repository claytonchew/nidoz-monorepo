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
		<template #registrationLink-cell="{ row }">
			<UFieldGroup class="w-full" size="lg">
				<UInput
					class="w-full"
					:value="constructRegistrationLink(row.original.id)"
					readonly
				/>
				<UButton
					icon="lucide:copy"
					color="neutral"
					variant="subtle"
					@click="copy(constructRegistrationLink(row.original.id))"
				/>
			</UFieldGroup>
		</template>

		<template #drawLink-cell="{ row }">
			<UFieldGroup class="w-full" size="lg">
				<UInput
					class="w-full"
					:value="constructDrawLink(row.original.id)"
					readonly
				/>
				<UButton
					icon="lucide:copy"
					color="neutral"
					variant="subtle"
					@click="copy(constructDrawLink(row.original.id))"
				/>
			</UFieldGroup>
		</template>
	</UTable>
</template>

<script setup lang="ts">
import type { DropdownMenuProps, TableColumn } from "#ui/types";
import type { Row } from "@tanstack/vue-table";
import { h, resolveComponent } from "vue";

const UDropdownMenu = resolveComponent("UDropdownMenu");
const UButton = resolveComponent("UButton");

const { copy } = useCopy();

const props = defineProps<{
	data: APIResponse<"/api/lucky-draws", "get">["records"];
	loading?: boolean;
	getActionItems: (
		row: Row<APIResponse<"/api/lucky-draws", "get">["records"][number]>,
	) => DropdownMenuProps["items"];
}>();

const emits = defineEmits<{
	refresh: [];
	"update:sort": [{ id: string; desc: boolean }[]];
}>();

const columns: ComputedRef<
	TableColumn<APIResponse<"/api/lucky-draws", "get">["records"][number]>[]
> = computed(() => [
	{
		id: "createdAt",
		header: ({ column }) => {
			const isSorted = column.getIsSorted();

			return h(UButton, {
				color: "neutral",
				variant: "ghost",
				label: "Created At",
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
			useDateFormat(new Date(row.original.createdAt), "DD MMM YYYY, hh:mm A")
				.value,
	},
	{
		header: "Name",
		accessorKey: "name",
	},
	{
		header: "Entries",
		accessorKey: "entries",
	},
	{
		header: "Registration Link",
		accessorKey: "registrationLink",
	},
	{
		header: "Draw Link",
		accessorKey: "drawLink",
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
		id: "createdAt",
		desc: false,
	},
]);

function constructRegistrationLink(id: string) {
	const baseUrl = useRuntimeConfig().public.nidoz.space.resident.baseUrl;
	return `${baseUrl}/lucky-draw/register/${id}`;
}

function constructDrawLink(id: string) {
	const baseUrl = useRuntimeConfig().public.nidoz.space.resident.baseUrl;
	return `${baseUrl}/lucky-draw/draw/${id}`;
}
</script>
