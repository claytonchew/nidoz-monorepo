export default defineNitroPlugin(async () => {
	try {
		await useMigrator().migrate();
		await useSeeder().run();
		console.info("Database migration and seeding completed!");
		process.exit(0);
	} catch (error) {
		console.error(error);
		process.exit(1);
	}
});
