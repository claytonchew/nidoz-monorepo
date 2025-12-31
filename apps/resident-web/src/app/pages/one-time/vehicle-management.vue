<template>
	<UPageCard
		:title="!showSuccess ? t('VehiclesRegistration') : undefined"
		:description="!showSuccess ? t('VehiclesRegistrationDescription') : undefined"
		variant="outline"
		class="max-w-md w-full m-4"
		:ui="{ description: 'text-sm'}"
	>
		<TransitionFade>
			<template v-if="!showSuccess">
				<div class="space-y-8">
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
				<div class="space-y-4 flex flex-col justify-center py-12">
					<FlashSuccess class="self-center" pulse/>
					<div class="space-y-2 w-full text-center">
						<p class="font-bold">{{ t("Successful")}}</p>
						<p class="text-sm">
							{{ t("VehiclesInformationUpdatedExpiredLink") }}
						</p>
					</div>
					<template v-if="postSuccessResults?.length">
						<div class="space-y-4 mt-4">
							<UPageCard
								v-for="vehicle in postSuccessResults"
								:key="vehicle.id"
								:title="vehicle.numberPlate"
								:description="`${vehicle.model} (${vehicle.color})`"
								variant="subtle"
								orientation="horizontal"
								reverse
								:ui="{ container: 'lg:flex lg:flex-row'}"
							>
								<UIcon name="lucide:car-front" class="size-8 text-muted"/>
							</UPageCard>
						</div>
					</template>
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
const postSuccessResults = ref<
	| {
			id: string;
			createdAt: string;
			updatedAt: string;
			unitId: string;
			numberPlate: string;
			model: string | null;
			color: string | null;
	  }[]
	| undefined
>([
	{
		id: "ne6evhhcplxni2omvjaijv5j",
		createdAt: "2025-12-30T12:39:41.000Z",
		updatedAt: "2025-12-31T10:39:04.000Z",
		unitId: "oh2h4hvif0xpg937v6skbhun",
		numberPlate: "SD9339V",
		model: "Chery Omoda",
		color: "Gray",
	},
	{
		id: "vlo41pb5cnlgxez9rwwhkvc1",
		createdAt: "2025-12-31T08:01:59.000Z",
		updatedAt: "2025-12-31T10:39:04.000Z",
		unitId: "oh2h4hvif0xpg937v6skbhun",
		numberPlate: "QM9339M",
		model: "Perodua Ativa",
		color: "Black",
	},
	{
		id: "vi1xln9crcys0ao8simg17y8",
		createdAt: "2025-12-31T09:48:16.000Z",
		updatedAt: "2025-12-31T10:39:04.000Z",
		unitId: "oh2h4hvif0xpg937v6skbhun",
		numberPlate: "V111A",
		model: "Benzi",
		color: "White",
	},
]);
const showResults = ref(false);

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
		const records = await $api("/api/one-time/vehicles", {
			method: "POST",
			body: {
				vehicles: event.data.vehicles,
			},
		});
		postSuccessResults.value = records;
		showSuccess.value = true;
	} finally {
		setTimeout(() => {
			loading.value = false;
		}, 1000);
	}
};
</script>
