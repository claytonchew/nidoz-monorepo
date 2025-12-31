<template>
	<UPageCard variant="outline" class="max-w-md w-full m-4">
		<TransitionFade>
			<template v-if="!showSuccess">
				<div class="space-y-4">
					<UAlert
						color="neutral"
						variant="subtle"
						icon="lucide:info"
						:title="t('SubmittingAsUnit', { unit })"
					>
						<template #description>
							<span class="text-muted">
								{{ t("IfThisIsNotYourUnitPleaseContactManagement")}}
							</span>
						</template>
					</UAlert>
					<SafeContainer
						v-bind="{data,status,error,refresh}"
						transition-mode="slide"
					>
						<div class="space-y-8">
							<FormVehicleGroup
								ref="form"
								:state="data! as any"
								:disabled="loading"
								:on-submit-handler="onSubmit"
							/>
							<UButton
								:label="t('Save')"
								color="neutral"
								size="lg"
								class="w-full justify-center"
								:loading="loading"
								@click="() => {
			form?.submit()
		}"
							/>
						</div>
					</SafeContainer>
				</div>
			</template>
			<template v-else>
				<div class="space-y-4 flex flex-col justify-center items-center py-12">
					<FlashSuccess pulse/>
					<div class="space-y-2 w-full text-center">
						<p class="font-bold">{{ t("Successful")}}</p>
						<p class="text-sm">
							{{ t("VehiclesInformationUpdatedExpiredLink") }}
						</p>
					</div>
				</div>
			</template>
		</TransitionFade>
	</UPageCard>
</template>

<script setup lang="ts">
import type { FormSubmitEvent } from "#ui/types";

const { t } = useI18n();

useSeoMeta({
	title: t("Vehicles"),
});

const unit = useState("unit", () => useCookie("vu"));

if (!unit.value) {
	showError({
		statusCode: 400,
		statusMessage: t("InvalidX", { field: t("Link") }),
		message: t("InvalidLinkMessage"),
	});
}

const { data, status, error, refresh } = await useAPI(
	"/api/one-time/vehicles",
	{ method: "GET" },
);

const form = templateRef("form");
const loading = ref(false);
const showSuccess = ref(false);

const onSubmit = async (
	event: FormSubmitEvent<{
		vehicles: {
			numberPlate: string;
			model: string;
			color: string;
			id?: string | undefined;
			createdAt?: Date | undefined;
			updatedAt?: Date | undefined;
		}[];
	}>,
) => {
	loading.value = true;
	try {
		await $api("/api/one-time/vehicles", {
			method: "POST",
			body: {
				vehicles: event.data.vehicles,
			},
		});
		showSuccess.value = true;
	} finally {
		setTimeout(() => {
			loading.value = false;
		}, 1000);
	}
};
</script>
