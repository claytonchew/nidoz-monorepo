import { eq } from "drizzle-orm";
import { defineJob, defineStep } from "../../src/module/seed";
import * as schema from "../../src/schema";

export default defineJob([
	defineStep(async (tx) => {
		const [existing] = await tx
			.select()
			.from(schema.admin)
			.where(eq(schema.admin.email, "chew1992@gmail.com"))
			.limit(1);

		if (existing) {
			console.info("└── ℹ️ Detected existing admin account, skipping creation.");
		}

		const [admin] = await tx
			.insert(schema.admin)
			.values({
				name: "Clayton Chew",
				email: "chew1992@gmail.com",
			})
			.returning();

		if (!admin) {
			console.error("└── ❌ Create first admin account failed.");
			throw new Error("Create first admin account failed.");
		}

		console.info(`└── ✅ Created first admin account: ${admin.email}`);
	}),
]);
