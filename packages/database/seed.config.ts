import insertFirstAdmin from "./seed/jobs/insert-first-admin";
import { defineSeedConfig } from "./src/module/seed";

export default defineSeedConfig({
	seed: {
		jobs: {
			insertFirstAdmin,
		},
		tests: {},
	},
});
