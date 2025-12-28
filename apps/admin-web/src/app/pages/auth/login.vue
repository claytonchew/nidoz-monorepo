<template>
	<UPageCard variant="subtle" class="max-w-sm w-full">
		<UAuthForm
			:schema="schema"
			:title="t('Login')"
			:description="t('LoginDescription')"
			icon="lucide:user"
			:fields="fields"
			:loading="loading"
			@submit="onSubmit"
		/>
	</UPageCard>
</template>

<script setup lang="ts">
import type { AuthFormField, FormSubmitEvent } from "@nuxt/ui";
import * as z from "zod";

const { t } = useI18n();

const fields = computed<AuthFormField[]>(() => [
	{
		type: "email",
		name: "email",
		label: t("Email"),
		placeholder: t("EnterYourX", { field: t("Email") }),
		required: true,
	},
	{
		type: "password",
		name: "password",
		label: t("Password"),
		placeholder: t("EnterYourX", { field: t("Password") }),
		required: true,
	},
]);

const schema = computed(() =>
	z.object({
		email: z.email(t("InvalidX", { field: t("Email") })),
		password: z.string(t("CannotBeEmpty")),
	}),
);

type Schema = z.infer<typeof schema.value>;

const loading = ref(false);
const { fetch: refreshSession } = useUserSession();

async function onSubmit(payload: FormSubmitEvent<Schema>) {
	try {
		loading.value = true;
		await $api("/api/auth/login-with-password", {
			method: "POST",
			body: payload.data,
		});
		await refreshSession();
		useToast().add({
			title: t("YouAreLoggedIn"),
			description: t("WelcomeBack"),
			color: "success",
		});
		navigateTo("/console");
		// delayed to prevent double submits
		onBeforeRouteLeave(() => {
			setTimeout(() => {
				loading.value = false;
			}, 1000);
		});
	} catch {
		loading.value = false;
	}
}
</script>
