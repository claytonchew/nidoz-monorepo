<template>
	<NuxtPage/>
</template>

<script setup lang="ts">
definePageMeta({
	layout: "console",
	middleware: ["auth"],
});
</script>
