import { Hash } from "@adonisjs/hash";
import { Scrypt } from "@adonisjs/hash/drivers/scrypt";
import type { ScryptConfig } from "@adonisjs/hash/types";
import { customAlphabet } from "nanoid";
import { hash } from "ohash";

const _hash = /* @__PURE__ */ new Map<string, Hash>();

function getHash(options: ScryptConfig = {}) {
	const key = hash(options);
	if (_hash.has(key)) {
		return _hash.get(key)!;
	}
	_hash.set(key, new Hash(new Scrypt(options)));
	return _hash.get(key)!;
}

/**
 * Hash a password using scrypt
 * @param password - The plain text password to hash
 * @param options - Scrypt configuration options
 * @returns The hashed password
 * @example
 * ```ts
 * const hashedPassword = await hashPassword('user_password')
 * ```
 */
export async function hashPassword(password: string, options?: ScryptConfig) {
	return await getHash(options).make(password);
}

/**
 * Verify a password against a hashed password
 * @param hashedPassword - The hashed password to verify against
 * @param plainPassword - The plain text password to verify
 * @param options - Scrypt configuration options
 * @returns `true` if the password is valid, `false` otherwise
 * @example
 * ```ts
 * const isValid = await verifyPassword(hashedPassword, 'user_password')
 * ```
 * @more you can configure the scrypt options in `auth.hash.scrypt`
 */
export async function verifyPassword(
	hashedPassword: string,
	plainPassword: string,
	options: ScryptConfig = {},
) {
	return await getHash(options).verify(hashedPassword, plainPassword);
}

/**
 * Generate a random numeric code
 * @param length - The length of the code to generate (default: 8)
 */
export function generateRandomCode(length: number = 8) {
	return customAlphabet("1234567890", length)();
}

/**
 * Generate a random password (or token)
 * @param length - The length of the password to generate (default: 16)
 */
export function generateRandomPassword(length: number = 16) {
	return customAlphabet("ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890", length)();
}
