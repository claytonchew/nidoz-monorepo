export default defineNitroPlugin(async () => {
	try {
		await useMigrator().migrate();
		await useSeeder().run();
	} catch (error) {
		console.error(error);
		process.exit(1);
	} finally {
		console.info("Database migration and seeding completed!");
	}
});
