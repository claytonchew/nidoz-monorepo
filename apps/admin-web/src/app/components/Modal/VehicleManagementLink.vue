<template>
	<UModal :title="t('ShareLink')">
		<template #body>
			<SafeContainer
				v-bind="{ data, status, error, refresh }"
				transition-mode="slide"
			>
				<div>
					<UCard :ui="{ body: 'space-y-4'}">
						<!-- case 1: expired link -->
						<template
							v-if="data && data.link && new Date(data.link.expiresAt) <= new Date()"
						>
							<UAlert
								title="Link Expired"
								description="The management link has expired. Please generate a new one."
								color="error"
								variant="subtle"
								icon="lucide:alert-triangle"
								class="mb-4"
							/>
							<UFieldGroup class="w-full" size="lg">
								<UInput class="w-full" :value="data.link.url" readonly/>
								<UButton
									label="Copy"
									:icon=" copied ? 'lucide:circle-check-big' : 'lucide:copy'"
									color="neutral"
									variant="subtle"
									@click="copy(data.link.url)"
								/>
							</UFieldGroup>
							<UBadge color="error" variant="subtle" icon="lucide:circle-x">
								Expired on
								{{ useDateFormat(new Date(data.link.expiresAt), "DD MMM YYYY, hh:mm A" ) }}
							</UBadge>
						</template>

						<!-- case 2: non-expired link -->
						<template v-else-if="data?.link">
							<UAlert
								title="Note"
								color="neutral"
								variant="subtle"
								icon="lucide:info"
								class="mb-4"
							>
								<template #description>
									<p class="text-muted">
										This link allows parcel owner or their representative to
										update their vehicle records.
									</p>
									<p class="mt-1 font-bold text-warning">
										This is a one-time use only and the link will be deleted
										upon submission.
									</p>
								</template>
							</UAlert>
							<UFieldGroup class="w-full" size="lg">
								<UInput class="w-full" :value="data.link.url" readonly/>
								<UButton
									label="Copy"
									:icon=" copied ? 'lucide:circle-check-big' : 'lucide:copy'"
									color="neutral"
									variant="subtle"
									@click="copy(data.link.url)"
								/>
							</UFieldGroup>
							<UBadge
								color="success"
								variant="subtle"
								icon="lucide:circle-check"
							>
								Valid until
								{{ useDateFormat(new Date(data.link.expiresAt), "DD MMM YYYY, hh:mm A" ) }}
							</UBadge>
						</template>

						<!-- case 3: no link -->
						<template v-else>
							<span class="text-muted block"
								>No link generated yet or has been used.</span
							>
							<UButton
								label="Generate Link"
								color="neutral"
								:loading="loading"
								@click="generateLink"
							/>
						</template>
					</UCard>
				</div>
			</SafeContainer>
			<template v-if="data?.link?.url">
				<div class="flex flex-wrap mt-4 gap-3">
					<UButton
						label="Generate New"
						:loading="loading"
						@click="generateLink"
						color="neutral"
					/>
					<UBadge color="neutral" variant="soft" icon="lucide:info">
						Generate new link will delete the existing link.
					</UBadge>
				</div>
			</template>
		</template>
	</UModal>
</template>

<script setup lang="ts">
const props = defineProps<{
	unit: string;
}>();

const emits = defineEmits<{
	close: [];
	refresh: [];
}>();

const { t } = useI18n();

const { copy, copied } = useCopy();

const { data, status, error, refresh } = await useAPI("/api/vehicle/link", {
	method: "GET",
	query: {
		unit: props.unit,
	},
});

const loading = ref(false);

async function generateLink() {
	loading.value = true;
	try {
		await $api("/api/vehicle/link", {
			method: "POST",
			query: { unit: props.unit },
		});
		refresh();
		emits("refresh");
		useToast().add({
			title: t("Successful"),
			description: "Management link generated successfully.",
			color: "success",
		});
	} finally {
		setTimeout(() => {
			loading.value = false;
		}, 1000);
	}
}
</script>
