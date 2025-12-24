import { hashPassword } from "@nidoz/utils";
import { eq } from "drizzle-orm";
import { defineJob, defineStep } from "../../src/module/seed";
import * as $schema from "../../src/schema";

function randomPassword(length = 12) {
	const chars =
		"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+[]{}|;:,.<>?";
	let password = "";
	for (let i = 0; i < length; i++) {
		const randomIndex = Math.floor(Math.random() * chars.length);
		password += chars[randomIndex];
	}
	return password;
}

export default defineJob([
	defineStep(async (tx) => {
		const [existing] = await tx
			.select()
			.from($schema.admin)
			.where(eq($schema.admin.email, "chew1992@gmail.com"))
			.limit(1);

		if (existing) {
			console.info("└── ℹ️ Detected existing admin account, skipping creation.");
			return;
		}

		// generate random password
		const password = randomPassword(16);
		const hashedPassword = await hashPassword(password);

		const [admin] = await tx
			.insert($schema.admin)
			.values({
				name: "Clayton Chew",
				email: "chew1992@gmail.com",
				hashedPassword,
			})
			.returning();

		if (!admin) {
			console.error("└── ❌ Create first admin account failed.");
			throw new Error("Create first admin account failed.");
		}

		console.info(`└── ✅ Created first admin account: ${admin.email}`);
		console.info(`└── 🔖 Password: ${password}`);
		console.info(
			`└── 👆 This password and totp will only be revealed once. Please keep it safe!`,
		);
	}),
]);
