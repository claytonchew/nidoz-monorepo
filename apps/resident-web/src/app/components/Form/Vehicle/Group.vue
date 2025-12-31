<template>
	<UForm
		ref="form"
		:schema="schema"
		:state="state as any"
		class="space-y-4"
		:disabled="props.disabled"
		:loading="props.loading"
		@submit="props.onSubmitHandler"
	>
		<UFormField name="vehicles" :ui="{ container: 'pt-4' }">
			<div class="space-y-4">
				<UCard
					v-for="(vehicle, index) in state.vehicles"
					:key="index"
					variant="subtle"
				>
					<template #header>
						<div class="flex items-center justify-between gap-2">
							<UBadge
								class="flex items-center gap-1"
								variant="subtle"
								color="neutral"
								icon="lucide:car-front"
								size="lg"
							>
								<span>{{ t("Vehicle") }}</span>
								<span>#{{ index + 1 }}</span>
							</UBadge>
							<UButton
								v-if="!props.disabled && !props.loading"
								icon="lucide:trash"
								variant="ghost"
								color="error"
								size="xs"
								:disabled="props.disabled || props.loading"
								@click="removeVehicle(index)"
							/>
						</div>
					</template>
					<FormVehicleEach
						v-model="state.vehicles[index]!"
						:name="`vehicles.${index}`"
						:disabled="props.disabled"
						:loading="props.loading"
					/>
				</UCard>
				<UButton
					v-if="Array.isArray(state.vehicles) ? state.vehicles.length < 4 : true"
					icon="lucide:plus"
					:label="t('AddVehicle')"
					class="w-full justify-center text-muted"
					variant="outline"
					color="neutral"
					size="xl"
					@click="addVehicle"
				/>
			</div>
		</UFormField>
	</UForm>
</template>

<script setup lang="ts">
import * as z from "zod";
import type { FormSubmitEvent } from "#ui/types";

const { t } = useI18n();

const props = defineProps<{
	loading?: boolean;
	disabled?: boolean;
	state?: z.input<typeof schema>;
	onSubmitHandler: (event: FormSubmitEvent<Schema>) => void | Promise<void>;
}>();

const form = templateRef("form");

const schema = z.object({
	vehicles: z
		.array(
			z.object({
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
				numberPlate: z.string().min(1, t("CannotBeEmpty")),
				model: z.string().min(1, t("CannotBeEmpty")),
				color: z.string().min(1, t("CannotBeEmpty")),
			}),
		)
		.max(4),
});

type Schema = z.infer<typeof schema>;

const state = ref<{
	vehicles: Partial<{
		numberPlate: string;
		model: string;
		color: string;
		id?: string | undefined;
		createdAt?: Date | undefined;
		updatedAt?: Date | undefined;
	}>[];
}>({
	vehicles: [],
});

if (props.state) {
	state.value = props.state as any;
}

function addVehicle() {
	if (!Array.isArray(state.value?.vehicles)) {
		state.value.vehicles = [];
	}
	state.value.vehicles.push({});
}

function removeVehicle(index: number) {
	if (
		Array.isArray(state.value.vehicles) &&
		index >= 0 &&
		index < state.value.vehicles.length
	) {
		state.value.vehicles.splice(index, 1);
	}
}

defineExpose({
	submit: async () => form.value?.submit(),
	validate: () => form.value?.validate({}),
	schema: schema,
});
</script>
