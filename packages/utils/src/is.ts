import { toStr } from "./base";

export const isDef = <T = any>(val?: T): val is T => typeof val !== "undefined";
export const isBoolean = (val: any): val is boolean => typeof val === "boolean";
export const isFunction = <T extends Function>(val: any): val is T =>
	typeof val === "function";
export const isNumber = (val: any): val is number => typeof val === "number";
export const isString = (val: unknown): val is string =>
	typeof val === "string";
export const isObject = (val: any): val is object =>
	toStr(val) === "[object Object]";
export const isUndefined = (val: any): val is undefined =>
	toStr(val) === "[object Undefined]";
export const isNull = (val: any): val is null => toStr(val) === "[object Null]";
export const isRegExp = (val: any): val is RegExp =>
	toStr(val) === "[object RegExp]";
export const isDate = (val: any): val is Date => toStr(val) === "[object Date]";

/**
 * Check if a value is primitive
 */
export function isPrimitive(
	val: any,
): val is string | number | boolean | symbol | bigint | null | undefined {
	return !val || Object(val) !== val;
}

/**
 * Determines whether the provided value is a plain JavaScript object.
 *
 * A plain object is defined as an object that:
 * - Is not null
 * - Has prototype of Object.prototype or null
 * - Is not an iterable
 * - Is not a module
 *
 * @example
 * ```ts
 * isPlainObject({}) // true
 * isPlainObject({ a: 1 }) // true
 * isPlainObject(Object.create(null)) // true
 * isPlainObject([]) // false
 * isPlainObject(null) // false
 * isPlainObject(new Date()) // false
 * ```
 */
export const isPlainObject = (val: unknown): val is Record<string, unknown> => {
	if (val === null || typeof val !== "object") {
		return false;
	}
	const prototype = Object.getPrototypeOf(val);

	if (
		prototype !== null &&
		prototype !== Object.prototype &&
		Object.getPrototypeOf(prototype) !== null
	) {
		return false;
	}

	if (Symbol.iterator in val) {
		return false;
	}

	if (Symbol.toStringTag in val) {
		return Object.prototype.toString.call(val) === "[object Module]";
	}

	return true;
};

/**
 * Checks if an object is empty, aka. `{}`.
 */
export const isObjectEmpty = (val: unknown): val is Record<string, never> => {
	return (
		val === null ||
		val === undefined ||
		(typeof val === "object" && Object.keys(val).length === 0) ||
		(Array.isArray(val) && val.length === 0)
	);
};

export const isWindow = (val: any): boolean =>
	// @ts-expect-error
	typeof window !== "undefined" && toStr(val) === "[object Window]";

// @ts-expect-error
export const isBrowser = typeof window !== "undefined";
