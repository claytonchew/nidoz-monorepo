import { describe } from "vitest";
import { hashPassword } from "./password";

describe("generate password", async () => {
	const password = "nidozmo88";
	console.log(await hashPassword(password));
	// $scrypt$n=16384,r=8,p=1$XarGzD4uqtREcVqyNFszdw$+FPYBDQqhO8IAwHvaYuj1Miwn3qlISodDDlISk1H3jbO3gygQLS27vv3IlPSrsofoslVOw1jp8dLjM6hly54wQ
});
