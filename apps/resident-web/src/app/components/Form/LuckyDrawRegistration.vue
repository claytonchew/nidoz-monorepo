<template>
	<UForm
		ref="form"
		:schema="schema"
		:state="state"
		class="space-y-4"
		:disabled="loading"
		@submit="onSubmitHandler"
	>
		<UFormField
			:label="t('UnitNumber')"
			:description="t('UnitNumberDescription')"
			name="unit"
			size="lg"
			required
		>
			<UInput
				v-model="state.unit"
				class="w-full"
				:placeholder="t('EnterYourX', { field: t('UnitNumber')})"
			/>
		</UFormField>
		<UFormField :label="t('Name')" name="name" size="lg" required>
			<UInput
				v-model="state.name"
				class="w-full"
				:placeholder="t('EnterYourX', { field: t('Name')})"
			/>
		</UFormField>
		<UFormField :label="t('Email')" name="email" size="lg">
			<UInput
				v-model="state.email"
				class="w-full"
				:placeholder="t('EnterYourX', { field: t('Email')})"
			/>
		</UFormField>
		<UFormField :label="t('PhoneNumber')" name="phoneNumber" size="lg">
			<UInput
				v-model="state.phoneNumber"
				class="w-full"
				:placeholder="t('EnterYourX', { field: t('PhoneNumber')})"
			/>
		</UFormField>

		<UButton
			color="neutral"
			class="w-full justify-center mt-2"
			size="xl"
			type="submit"
		>
			Submit
		</UButton>
	</UForm>
</template>

<script setup lang="ts">
import * as z from "zod";
import type { FormSubmitEvent } from "#ui/types";

const { t } = useI18n();

const props = defineProps<{
	id?: string;
}>();

const emits = defineEmits<{
	success: [];
}>();

const form = useTemplateRef("form");

const schema = z.object({
	unit: z
		.string(t("CannotBeEmpty"))
		.min(1, t("CannotBeEmpty"))
		.refine(
			(val) => {
				try {
					parseResidentialUnit(val.trim());
					return true;
				} catch (error) {
					return false;
				}
			},
			{ error: t("InvalidX", { field: t("UnitNumber") }) },
		),
	name: z.string(t("CannotBeEmpty")).min(1, t("CannotBeEmpty")),
	email: z.preprocess((val) => {
		if (typeof val === "string") {
			if (val.trim() === "") {
				return undefined;
			} else {
				return val;
			}
		}
		return undefined;
	}, z.email({ error: t("InvalidX", { field: t("Email") }) }).optional()),
	phoneNumber: z
		.string()
		.transform((val) => (val.trim() === "" ? undefined : val))
		.optional(),
});

type Schema = z.infer<typeof schema>;

const state = ref<Partial<Schema>>({
	unit: undefined,
	name: undefined,
	email: undefined,
	phoneNumber: undefined,
});

const loading = ref(false);

async function onSubmitHandler(event: FormSubmitEvent<Schema>) {
	loading.value = true;
	try {
		await $api("/api/lucky-draw/entry", {
			method: "POST",
			query: { id: props.id },
			body: event.data,
		});
		emits("success");
	} finally {
		setTimeout(() => {
			loading.value = false;
		}, 1000);
	}
}

defineExpose({
	submit: async () => form.value?.submit(),
	validate: () => form.value?.validate({}),
	loading: loading,
	schema: schema,
	reset: () => {
		state.value = {
			unit: undefined,
			name: undefined,
			email: undefined,
			phoneNumber: undefined,
		};
		form.value?.clear();
	},
});
</script>
