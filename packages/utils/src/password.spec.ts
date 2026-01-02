import { describe, it } from "vitest";
import { hashPassword } from "./password";

describe("generate password", async () => {
	const email = "nidozmgmt@gmail.com";
	const password = "Nidozmgmt1*";
	console.log(email);
	console.log(await hashPassword(password));

	it("no-op", () => {});
});
