import insertFirstAdmin from "./seed/jobs/insert-first-admin";
import changeAdminPassword from "./seed/tests/change-admin-password";
import { defineSeedConfig } from "./src/module/seed";

export default defineSeedConfig({
	seed: {
		jobs: {
			insertFirstAdmin,
		},
		tests: {
			changeAdminPassword,
		},
	},
});
