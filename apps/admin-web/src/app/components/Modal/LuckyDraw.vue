<template>
	<UModal title="Lucky Draw">
		<template #body>
			<FormLuckyDraw
				ref="form"
				:id="props.id"
				@close="emits('close')"
				@refresh="emits('refresh')"
			/>
		</template>

		<template #footer>
			<div class="flex justify-end w-full">
				<UButton
					:label="props.id ? 'Update' : 'Create'"
					color="neutral"
					size="md"
					:loading="form?.loading"
					@click="() => {
						form?.submit()
					}"
				/>
			</div>
		</template>
	</UModal>
</template>

<script setup lang="ts">
const props = defineProps<{
	id?: string;
}>();

const emits = defineEmits<{
	close: [];
	refresh: [];
}>();

const form = useTemplateRef("form");
</script>
