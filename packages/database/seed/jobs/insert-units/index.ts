import { defineJob, defineStep } from "../../../src/module/seed";
import { eq } from "drizzle-orm";
import * as $schema from "../../../src/schema";
import {
	BLOCKS,
	FLOORS,
	UNITNO,
} from "../../../src/constants/residential-unit";

export default defineJob([
	defineStep(async (tx) => {
		for (const block of BLOCKS) {
			for (const floor of FLOORS) {
				for (const number of UNITNO) {
					await tx
						.insert($schema.unit)
						.values({
							block,
							floor,
							number,
						})
						.onConflictDoNothing();
				}
			}
		}
		console.info(`└── ✅ Units inserted successfully.`);
	}),
]);
