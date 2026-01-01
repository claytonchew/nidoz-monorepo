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
			label="Name"
			description="The name of the lucky draw campaign."
			name="name"
		>
			<UInput v-model="state.name" class="w-full" placeholder="Enter name"/>
		</UFormField>
	</UForm>
</template>

<script setup lang="ts">
import * as z from "zod";
import type { FormSubmitEvent } from "#ui/types";

const props = defineProps<{
	id?: string;
}>();

const emits = defineEmits<{
	close: [];
	refresh: [];
}>();

const form = useTemplateRef("form");

const schema = z.object({
	name: z.string().optional(),
});

type Schema = z.infer<typeof schema>;

const state = ref<Partial<Schema>>({
	name: undefined,
});

if (props.id) {
	const data = await $api("/api/lucky-draw", {
		method: "GET",
		query: { id: props.id },
	});
	state.value = schema.parse(data);
}

const loading = ref(false);

async function onSubmitHandler(event: FormSubmitEvent<Schema>) {
	loading.value = true;
	try {
		if (props.id) {
			await $api("/api/lucky-draw", {
				method: "PATCH",
				query: { id: props.id },
				body: event.data,
			});
			useToast().add({
				title: "Successful",
				description: "Lucky draw updated successfully.",
				color: "success",
			});
			emits("refresh");
			emits("close");
		} else {
			await $api("/api/lucky-draw", { method: "PUT", body: event.data });
			useToast().add({
				title: "Successful",
				description: "Lucky draw created successfully.",
				color: "success",
			});
			emits("refresh");
			emits("close");
		}
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
});
</script>
