import { defineJob, defineStep } from "../../../src/module/seed";
import { eq } from "drizzle-orm";
import * as $schema from "../../../src/schema";

const BLOCKS = ["A", "B", "C", "D"];

const FLOORS = [
	"08",
	"09",
	"10",
	"11",
	"12",
	"13",
	"13A",
	"15",
	"16",
	"17",
	"18",
	"19",
	"20",
	"21",
	"22",
	"23",
	"23A",
	"25",
	"26",
	"27",
	"28",
	"29",
	"30",
	"31",
	"32",
	"33",
	"33A",
	"35",
	"36",
	"37",
	"38",
	"39",
	"40",
];

const NUMBERS = ["01", "02", "03", "3A", "05", "06", "07", "08", "09", "10"];

export default defineJob([
	defineStep(async (tx) => {
		for (const block of BLOCKS) {
			for (const floor of FLOORS) {
				for (const number of NUMBERS) {
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
