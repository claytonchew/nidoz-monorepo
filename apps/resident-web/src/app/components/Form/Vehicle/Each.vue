<template>
	<UForm
		:schema="schema"
		:state="state"
		class="space-y-4"
		:disabled="props.disabled"
		:loading="props.loading"
		:nested="props.nested"
	>
		<UFormField :label="t('NumberPlate')" name="numberPlate">
			<UInput
				v-model="state.numberPlate"
				class="w-full"
				:placeholder="t('EnterX', { field: t('NumberPlate')})"
				:loading="props.loading"
			/>
		</UFormField>
		<div class="grid grid-cols-2 gap-4">
			<UFormField :label="t('Model')" name="model">
				<UInput
					v-model="state.model"
					class="w-full"
					:placeholder="t('EnterX', { field: t('Model')})"
					:loading="props.loading"
				/>
			</UFormField>
			<UFormField :label="t('Color')" name="color">
				<UInput
					v-model="state.color"
					class="w-full"
					:placeholder="t('EnterX', { field: t('Color')})"
					:loading="props.loading"
				/>
			</UFormField>
		</div>
	</UForm>
</template>

<script setup lang="ts">
import * as z from "zod";

const { t } = useI18n();

const props = withDefaults(
	defineProps<{
		loading?: boolean;
		disabled?: boolean;
		nested?: boolean;
	}>(),
	{
		nested: true,
	},
);

const schema = z.object({
	id: z.string().optional(),
	createdAt: z
		.string()
		.transform((val) => new Date(val))
		.or(z.date())
		.optional(),
	updatedAt: z
		.string()
		.transform((val) => new Date(val))
		.or(z.date())
		.optional(),
	numberPlate: z.string(t("CannotBeEmpty")).min(1, t("CannotBeEmpty")),
	model: z.string(t("CannotBeEmpty")).min(1, t("CannotBeEmpty")),
	color: z.string(t("CannotBeEmpty")).min(1, t("CannotBeEmpty")),
});

type Schema = z.infer<typeof schema>;

const state = defineModel<Partial<Schema>>({ required: true });
</script>
