<template>
	<UPageCard
		:icon="!showSuccess ? 'lucide:gift' : undefined"
		:title="!showSuccess ? data?.name ?? undefined : undefined"
		:description="!showSuccess ? data ? t('LuckyDrawDescription') : undefined: undefined"
		variant="outline"
		class="max-w-md w-full m-4"
	>
		<template v-if="!showSuccess">
			<SafeContainer v-bind="{ data, status, error, refresh }">
				<div class="mt-2">
					<FormLuckyDrawRegistration
						ref="form"
						:id="useRoute().params.id as string"
						@success="() => {
							showSuccess = true;
						}"
					/>
				</div>
			</SafeContainer>
		</template>
		<template v-else>
			<div class="space-y-4 flex flex-col justify-center py-12">
				<FlashSuccess class="self-center" pulse/>
				<div class="space-y-2 w-full text-center">
					<p class="font-bold">{{ t("Successful")}}</p>
					<p class="text-md px-8">
						{{ t("LuckyDrawRegistrationCompletedMessage") }}
					</p>
				</div>
				<UButton
					:label="t('Okay')"
					icon="lucide:check-circle"
					color="neutral"
					variant="solid"
					size="xl"
					class="mt-4 justify-center"
					@click="reset"
				/>
			</div>
		</template>
	</UPageCard>
</template>

<script setup lang="ts">
const { t } = useI18n();

useSeoMeta({
	title: t("LuckyDraw"),
});

const { data, error, status, refresh } = useAPI("/api/lucky-draw", {
	method: "GET",
	query: { id: useRoute().params.id },
});

const form = useTemplateRef("form");
const showSuccess = ref(false);

const reset = () => {
	form.value?.reset();
	showSuccess.value = false;
};
</script>
