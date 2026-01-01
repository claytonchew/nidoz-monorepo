<template>
	<USlideover title="Lucky Draw Entries">
		<template #body>
			<div class="space-y-8">
				<div class="w-full">
					<UInput
						v-model="search"
						class="w-full"
						icon="lucide:search"
						placeholder="i.e. A-08-01"
						:highlight="Boolean(search)"
					/>
				</div>
				<SafeContainer
					v-bind="{ data, status, error, refresh }"
					transition-mode="slide"
				>
					<div v-if="data && data.records.length === 0">
						<span class="text-dimmed">No entries yet</span>
					</div>
					<div v-else class="space-y-4">
						<UPageCard
							v-for="entry of data?.records ?? []"
							:key="entry.id"
							:title="entry.unit"
							variant="subtle"
							orientation="horizontal"
							reverse
							:ui="{ container: 'lg:flex lg:flex-row'}"
						>
							<template #description>
								<div class="space-y-1 text-muted text-sm">
									<p>
										<strong>Participant Name:</strong>
										{{ entry.name }}
									</p>
									<p v-if="entry.email">
										<strong>Email:</strong>
										{{entry.email }}
									</p>
									<p v-if="entry.phoneNumber">
										<strong>Contact:</strong>
										{{entry.phoneNumber }}
									</p>
									<p>
										<strong>Entry Date:</strong>
										{{ useDateFormat(new Date(entry.createdAt), "DD MMM YYYY, hh:mm A" ) }}
									</p>
								</div>
							</template>
						</UPageCard>
					</div>
				</SafeContainer>
			</div>
		</template>

		<template v-if="data?.records" #footer>
			<div class="flex items-center justify-center w-full">
				<UPagination
					v-model:page="page"
					:items-per-page="pageSize"
					:total="total"
				/>
			</div>
		</template>
	</USlideover>
</template>

<script setup lang="ts">
const props = defineProps<{
	id: string;
}>();

const page = ref(1);
const pageSize = ref(10);
const total = ref(0);

const search = ref<string>("");
const debouncedSearch = refDebounced(search, 350);

const { data, status, error, refresh } = useAPI("/api/lucky-draw/entries", {
	method: "GET",
	query: { id: props.id, page, pageSize, search: debouncedSearch },
});
</script>
