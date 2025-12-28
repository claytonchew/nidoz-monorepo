import { hashPassword } from "@nidoz/utils";
import { eq } from "drizzle-orm";
import { defineJob, defineStep } from "../../src/module/seed";
import * as $schema from "../../src/schema";

export default defineJob([
	defineStep(async (tx) => {
		const hashedPassword = await hashPassword("password");

		await tx.update($schema.admin).set({ hashedPassword });

		console.info(`└── ✅ [Dev] Changed admin password to "password".`);
	}),
]);
