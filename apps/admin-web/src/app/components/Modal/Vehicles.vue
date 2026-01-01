<template>
	<UModal :title="t('Vehicles')">
		<template #body>
			<SafeContainer
				v-bind="{ data, status, error, refresh }"
				transition-mode="slide"
			>
				<FormVehicleGroup
					ref="form"
					:state="data! as any"
					:disabled="loading"
					:on-submit-handler="onSubmit"
				/>
			</SafeContainer>
		</template>

		<template v-if="data" #footer>
			<div class="flex justify-end w-full">
				<UButton
					:label="t('Save')"
					color="neutral"
					size="md"
					:loading="loading"
					@click="() => {
				form?.submit()
			}"
				/>
			</div>
		</template>
	</UModal>
</template>

<script setup lang="ts">
import type { FormSubmitEvent } from "#ui/types";

const props = defineProps<{
	unit: string;
}>();

const emits = defineEmits<{
	close: [];
	refresh: [];
}>();

const { t } = useI18n();

const { data, status, error, refresh } = await useAPI("/api/vehicle", {
	method: "GET",
	query: {
		unit: props.unit,
	},
});

const form = useTemplateRef("form");
const loading = ref(false);

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
		await $api("/api/vehicle", {
			method: "POST",
			query: {
				unit: props.unit,
			},
			body: {
				vehicles: event.data.vehicles,
			},
		});
		useToast().add({
			title: t("Successful"),
			description: t("VehicleInformationUpdated"),
			color: "success",
		});
		emits("refresh");
		emits("close");
	} finally {
		setTimeout(() => {
			loading.value = false;
		}, 1000);
	}
};
</script>
