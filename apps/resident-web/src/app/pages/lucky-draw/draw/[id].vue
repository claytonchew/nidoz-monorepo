<template>
	<UPageCard
		icon="lucide:gift"
		:title="data?.name ?? undefined"
		variant="outline"
		class="max-w-xl w-full m-4"
	>
		<SafeContainer v-bind="{ data, status, error, refresh }">
			<div class="space-y-8">
				<div class="min-h-32 flex items-center justify-center">
					<LoadingSpinner v-if="loading" size="6rem"/>
					<span v-else-if="!luckyDrawResult" class="text-muted">
						Press "Draw" to draw the lucky winner.
					</span>
					<span v-else class="text-6xl font-bold tracking-wide"
						>{{ luckyDrawResult.unit }}</span
					>
					<!-- <UPopover v-else arrow>
						<span class="text-6xl font-bold tracking-wide"
							>{{ luckyDrawResult.unit }}</span
						>

						<template #content>
							<UPageCard :title="luckyDrawResult.name ?? undefined">
								<template #description>
									<div class="space-y-1 text-sm text-muted">
										<p v-if="luckyDrawResult.email">
											<strong>Email:</strong>
											{{luckyDrawResult.email }}
										</p>
										<p v-if="luckyDrawResult.phoneNumber">
											<strong>Contact:</strong>
											{{luckyDrawResult.phoneNumber }}
										</p>
										<p>
											<strong>Entry Date:</strong>
											{{ useDateFormat(new Date(luckyDrawResult.createdAt), "DD MMM YYYY, hh:mm A" ) }}
										</p>
									</div>
								</template>
							</UPageCard>
						</template>
					</UPopover> -->
				</div>

				<UButton
					label="Draw"
					color="neutral"
					size="xl"
					class="w-full justify-center"
					:disabled="loading"
					@click="draw"
				/>
			</div>
		</SafeContainer>
	</UPageCard>
</template>

<script setup lang="ts">
const { data, error, status, refresh } = useAPI("/api/lucky-draw", {
	method: "GET",
	query: { id: useRoute().params.id },
});

const loading = ref(false);
const luckyDrawResult = ref<APIResponse<"/api/lucky-draw/pick", "get"> | null>(
	null,
);

async function draw() {
	loading.value = true;
	try {
		const response = await $api("/api/lucky-draw/pick", {
			method: "GET",
			query: { id: useRoute().params.id },
		});
		luckyDrawResult.value = response;
	} finally {
		setTimeout(() => {
			loading.value = false;
		}, 5000);
	}
}
</script>
