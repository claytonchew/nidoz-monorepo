import { notNullish } from "./guards";
import { isObject, isPlainObject, isPrimitive } from "./is";
import { randomStr } from "./string";
import type {
	DeepAssign,
	DeepMerge,
	DeepUnionToDissection,
	OmitByPath,
	PickByPath,
	SerializeObject,
} from "./types";

/**
 * Map key/value pairs for an object, and construct a new one
 *
 *
 * @category Object
 *
 * Transform:
 * @example
 * ```
 * objectMap({ a: 1, b: 2 }, (k, v) => [k.toString().toUpperCase(), v.toString()])
 * // { A: '1', B: '2' }
 * ```
 *
 * Swap key/value:
 * @example
 * ```
 * objectMap({ a: 1, b: 2 }, (k, v) => [v, k])
 * // { 1: 'a', 2: 'b' }
 * ```
 *
 * Filter keys:
 * @example
 * ```
 * objectMap({ a: 1, b: 2 }, (k, v) => k === 'a' ? undefined : [k, v])
 * // { b: 2 }
 * ```
 */
export function objectMap<
	K extends string,
	V,
	NK extends string | number | symbol = K,
	NV = V,
>(
	obj: Record<K, V>,
	fn: (key: K, value: V) => [NK, NV] | undefined,
): Record<NK, NV> {
	return Object.fromEntries(
		Object.entries(obj)
			.map(([k, v]) => fn(k as K, v as V))
			.filter(notNullish),
	) as Record<NK, NV>;
}

/**
 * Type guard for any key, `k`.
 * Marks `k` as a key of `T` if `k` is in `obj`.
 *
 * @category Object
 * @param obj object to query for key `k`
 * @param k key to check existence in `obj`
 */
export function isKeyOf<T extends object>(obj: T, k: keyof any): k is keyof T {
	return k in obj;
}

/**
 * Strict typed `Object.keys`
 *
 * @category Object
 */
export function objectKeys<T extends object>(obj: T) {
	return Object.keys(
		obj,
	) as Array<`${keyof T & (string | number | boolean | null | undefined)}`>;
}

/**
 * Strict typed `Object.entries`
 *
 * @category Object
 */
export function objectEntries<T extends object>(obj: T) {
	return Object.entries(obj) as Array<[keyof T, T[keyof T]]>;
}

/**
 * Deep merge
 *
 * The first argument is the target object, the rest are the sources.
 * The target object will be mutated and returned.
 *
 * @category Object
 */
export function deepMerge<T extends object = object, S extends object = T>(
	target: T,
	...sources: S[]
): DeepMerge<T, S> {
	if (!sources.length) return target as any;

	const source = sources.shift();
	if (source === undefined) return target as any;

	if (isMergableObject(target) && isMergableObject(source)) {
		objectKeys(source).forEach((key) => {
			if (key === "__proto__" || key === "constructor" || key === "prototype")
				return;

			// @ts-expect-error
			if (isMergableObject(source[key])) {
				// @ts-expect-error
				if (!target[key])
					// @ts-expect-error
					target[key] = {};

				// @ts-expect-error
				if (isMergableObject(target[key])) {
					deepMerge(target[key], source[key]);
				} else {
					// @ts-expect-error
					target[key] = source[key];
				}
			} else {
				// @ts-expect-error
				target[key] = source[key];
			}
		});
	}

	return deepMerge(target, ...sources);
}

/**
 * Deep merge
 *
 * Differs from `deepMerge` in that it merges arrays instead of overriding them.
 *
 * The first argument is the target object, the rest are the sources.
 * The target object will be mutated and returned.
 *
 * @category Object
 */
export function deepMergeWithArray<
	T extends object = object,
	S extends object = T,
>(target: T, ...sources: S[]): DeepMerge<T, S> {
	if (!sources.length) return target as any;

	const source = sources.shift();
	if (source === undefined) return target as any;

	if (Array.isArray(target) && Array.isArray(source)) target.push(...source);

	if (isMergableObject(target) && isMergableObject(source)) {
		objectKeys(source).forEach((key) => {
			if (key === "__proto__" || key === "constructor" || key === "prototype")
				return;

			// @ts-expect-error
			if (Array.isArray(source[key])) {
				// @ts-expect-error
				if (!target[key])
					// @ts-expect-error
					target[key] = [];

				// @ts-expect-error
				deepMergeWithArray(target[key], source[key]);
			}
			// @ts-expect-error
			else if (isMergableObject(source[key])) {
				// @ts-expect-error
				if (!target[key])
					// @ts-expect-error
					target[key] = {};

				// @ts-expect-error
				deepMergeWithArray(target[key], source[key]);
			} else {
				// @ts-expect-error
				target[key] = source[key];
			}
		});
	}

	return deepMergeWithArray(target, ...sources);
}

/**
 * Deeply assigns properties from `assign` object to `base` object.
 *
 * Properties in `assign` will override properties in `base`.
 * If both objects have an object at the same key, those objects are recursively merged.
 * Null values in `assign` will set the corresponding property to undefined, unless `opts.setNullAsNull = true`,
 * in which case, the property will be explicitly set null. Undefined values in `assign` are skipped.
 *
 * @example
 * ```ts
 * // Simple merge
 * const base = { a: 1, b: 2 };
 * const assign = { b: 3, c: 4 };
 * assignObject(base, assign); // { a: 1, b: 3, c: 4 }
 *
 * // Deep merge
 * const baseNested = { user: { name: 'John', age: 30 } };
 * const assignNested = { user: { age: 31, city: 'New York' } };
 * assignObject(baseNested, assignNested);
 * // { user: { name: 'John', age: 31, city: 'New York' } }
 *
 * // Handling null values
 * const baseWithProps = { a: 1, b: 2 };
 * const assignWithNull = { b: null };
 * assignObject(baseWithProps, assignWithNull); // { a: 1 }
 * assignObject(baseWithProps, assignWithNull, { assignNullAsNull: true }); // { a: 1, b: null }
 * ```
 * @category Object
 */
export const assignObject = <
	T extends object = object,
	S extends object = T,
	SetNullAsNull extends boolean = false,
>(
	base: T,
	assign: S,
	opts?: { setNullAsNull?: SetNullAsNull },
): DeepAssign<T, S, SetNullAsNull> => {
	if (!isPlainObject(assign)) {
		return assignObject(base, {} as S);
	}

	const object = Object.assign({}, base) as Record<string, any>;

	for (const key in assign) {
		if (key === "__proto__" || key === "constructor") {
			continue;
		}

		const value = assign[key as keyof S];

		if (value === undefined) {
			continue;
		}

		if (value === null) {
			if (opts?.setNullAsNull) {
				object[key] = null;
			} else {
				object[key] = undefined;
			}
			continue;
		}

		if (isPlainObject(value) && isPlainObject(object[key])) {
			object[key] = assignObject(object[key], value as object, opts);
		} else {
			object[key] = value;
		}
	}

	return object as DeepAssign<T, S, SetNullAsNull>;
};

function isMergableObject(item: any): item is object {
	return isObject(item) && !Array.isArray(item);
}

/**
 * Create a new subset object by giving keys
 *
 * @category Object
 */
export function objectPickKeys<O extends object, T extends keyof O>(
	obj: O,
	keys: T[],
	omitUndefined = false,
) {
	return keys.reduce(
		(n, k) => {
			if (k in obj) {
				if (!omitUndefined || obj[k] !== undefined) n[k] = obj[k];
			}
			return n;
		},
		{} as Pick<O, T>,
	);
}

/**
 * Create a new subset object by picking given key path(s), supporting nested properties using dot notation.
 *
 * @experimental This utility is experimental and may not work in some edge cases. Please test thoroughly before using in production.
 *
 * @example
 * // Picks the nested 'bar' property
 * const obj = { foo: { bar: 123, baz: 456 } };
 * const result = objectPick(obj, ['foo.bar']); // { foo: { bar: 123 } }
 *
 * @example
 * // Picks multiple properties
 * const obj = { a: 1, b: 2, foo: { bar: 123, baz: 456 } };
 * const result = objectPick(obj, ['a', 'foo.bar']); // { a: 1, foo: { bar: 123 } }
 *
 * @param obj - The source object to pick properties from
 * @param paths - Array of strings representing property paths to pick, with nested properties
 *               separated by dots (e.g., 'parent.child.grandchild')
 * @returns A new object with only the specified properties
 */
export const objectPick = <T extends object, P extends string = string>(
	obj: T,
	paths: P[],
): DeepUnionToDissection<PickByPath<T, P>> => {
	if (paths.length === 0) {
		return {} as DeepUnionToDissection<PickByPath<T, P>>;
	}

	// Helper to expand wildcard paths into concrete paths
	const expandWildcards = (obj: any, pathKeys: string[]): string[][] => {
		if (pathKeys.length === 0) return [[]];

		const [currentKey, ...remainingKeys] = pathKeys;

		// If current key is not a wildcard, just recurse
		if (currentKey !== "*") {
			if (remainingKeys.length === 0) {
				return [[currentKey]];
			}

			// Navigate to next level
			const nextObj = obj?.[currentKey];
			const expandedRest = expandWildcards(nextObj, remainingKeys);
			return expandedRest.map((rest) => [currentKey, ...rest]);
		}

		// Handle wildcard - expand to all indices/keys
		if (!Array.isArray(obj)) {
			// For non-arrays, wildcard doesn't make sense, return empty
			return [];
		}

		// Expand wildcard for array indices
		const results: string[][] = [];
		for (let i = 0; i < obj.length; i++) {
			const expandedRest = expandWildcards(obj[i], remainingKeys);
			for (const rest of expandedRest) {
				results.push([String(i), ...rest]);
			}
		}

		return results;
	};

	// Helper to recursively pick properties from an object
	const pickRecursive = (source: any, pathKeys: string[]): any => {
		if (pathKeys.length === 0 || source === undefined || source === null) {
			return undefined;
		}

		const [currentKey, ...remainingKeys] = pathKeys;

		// If this is the last key, return the value
		if (remainingKeys.length === 0) {
			return source[currentKey];
		}

		// For arrays, handle numeric indices specially
		if (Array.isArray(source)) {
			const index = Number.parseInt(currentKey);
			if (!Number.isNaN(index) && index >= 0 && index < source.length) {
				// Pick from the specific array element
				const picked = pickRecursive(source[index], remainingKeys);
				if (picked !== undefined) {
					// Need to reconstruct the nested structure
					const result: any = {};
					let current = result;
					for (let i = 0; i < remainingKeys.length - 1; i++) {
						current[remainingKeys[i]] = {};
						current = current[remainingKeys[i]];
					}
					current[remainingKeys[remainingKeys.length - 1]] = picked;
					return [result];
				}
			}
			return undefined;
		}

		// For objects, recurse into the property
		if (currentKey in source) {
			return pickRecursive(source[currentKey], remainingKeys);
		}

		return undefined;
	};

	// Helper to merge a picked value into the result at the given path
	const mergeIntoResult = (result: any, pathKeys: string[], value: any) => {
		if (pathKeys.length === 0) return;

		const [currentKey, ...remainingKeys] = pathKeys;

		if (remainingKeys.length === 0) {
			// Last key - set the value
			result[currentKey] = value;
			return;
		}

		// Need to go deeper
		// Check if the next segment involves an array index
		const nextKey = remainingKeys[0];
		const isNextNumeric = /^\d+$/.test(nextKey);

		if (!result[currentKey]) {
			// Determine if we need an array or object
			// If value is an array and we consumed an array index in the path, it's an array
			result[currentKey] = Array.isArray(value) && isNextNumeric ? [] : {};
		}

		if (Array.isArray(value) && isNextNumeric) {
			// The value is an array (from pickRecursive) and we need to place it at a specific index
			// The array index is in nextKey (first element of remainingKeys)
			const arrayIndex = Number.parseInt(nextKey);

			// Ensure result[currentKey] is an array
			if (!Array.isArray(result[currentKey])) {
				result[currentKey] = [];
			}

			// Check if we already have an element at this index
			if (result[currentKey][arrayIndex] !== undefined) {
				// Merge with existing element by recursively merging the properties
				const existingElement = result[currentKey][arrayIndex];
				const newElement = value[0];
				Object.assign(existingElement, newElement);
			} else {
				// Add the element at the specific index
				result[currentKey][arrayIndex] = value[0];
			}
		} else {
			mergeIntoResult(result[currentKey], remainingKeys, value);
		}
	};

	// Check if one path is a prefix of another
	const isPrefix = (shorter: string[], longer: string[]): boolean => {
		if (shorter.length >= longer.length) return false;
		return shorter.every((key, i) => key === longer[i]);
	};

	// Parse paths and expand wildcards
	const parsedPaths = paths
		.map((path) => path.split("."))
		.flatMap((pathKeys) => {
			// Check if this path contains wildcards
			if (pathKeys.includes("*")) {
				// Expand wildcards into concrete paths
				return expandWildcards(obj, pathKeys);
			}
			return [pathKeys];
		})
		.sort((a, b) => a.length - b.length);

	// Filter out paths that have a less specific parent path already picked
	const filteredPaths: string[][] = [];
	for (const path of parsedPaths) {
		const hasLessSpecific = filteredPaths.some((existing) =>
			isPrefix(existing, path),
		);
		if (!hasLessSpecific) {
			filteredPaths.push(path);
		}
	}

	const result: any = {};

	for (const keys of filteredPaths) {
		const value = pickRecursive(obj, keys);
		if (value !== undefined) {
			mergeIntoResult(result, keys, structuredClone(value));
		}
	}

	// Compact arrays that have only one element with holes (undefined values)
	const compactArrays = (obj: any): any => {
		if (Array.isArray(obj)) {
			// Filter out undefined values
			const compacted = obj.filter((item) => item !== undefined);
			// Recursively compact nested objects/arrays
			return compacted.map((item) => compactArrays(item));
		}
		if (obj && typeof obj === "object") {
			const result: any = {};
			for (const key in obj) {
				result[key] = compactArrays(obj[key]);
			}
			return result;
		}
		return obj;
	};

	return compactArrays(result) as DeepUnionToDissection<PickByPath<T, P>>;
};

/**
 * Create a new subset object by omit giving key path(s), supporting nested properties using dot notation.
 *
 * @example
 * // Removes the nested 'bar' property
 * const obj = { foo: { bar: 123, baz: 456 } };
 * const result = objectOmit(obj, ['foo.bar']); // { foo: { baz: 456 } }
 *
 * @example
 * // Removes multiple properties
 * const obj = { a: 1, b: 2, foo: { bar: 123, baz: 456 } };
 * const result = objectOmit(obj, ['a', 'foo.bar']); // { b: 2, foo: { baz: 456 } }
 *
 * @param obj - The source object to create a modified copy from
 * @param paths - Array of strings representing property paths to remove, with nested properties
 *               separated by dots (e.g., 'parent.child.grandchild')
 * @returns A new object with the specified properties removed
 */
export const objectOmit = <T extends object, P extends string = string>(
	obj: T,
	paths: P[],
): DeepUnionToDissection<OmitByPath<T, P>> => {
	if (paths.length === 0) {
		return structuredClone(obj) as DeepUnionToDissection<OmitByPath<T, P>>;
	}

	const cloneObj = structuredClone(obj);

	for (const path of paths) {
		const keys = path.split(".");
		let current: any = cloneObj;
		let valid = true;

		for (let i = 0; i < keys.length - 1; i++) {
			const currentKey = keys[i] as keyof typeof current;
			if (current[currentKey] === undefined) {
				valid = false;
				break;
			}
			current = current[currentKey];
		}

		if (valid) {
			const lastKey = keys[keys.length - 1] as keyof typeof current;
			if (current[lastKey] !== undefined) {
				// eslint-disable-next-line @typescript-eslint/no-dynamic-delete
				delete current[lastKey];
			}
		}
	}

	return cloneObj as DeepUnionToDissection<OmitByPath<T, P>>;
};

/**
 * Clear undefined fields from an object. It mutates the object
 *
 * @category Object
 */
export function clearUndefined<T extends object>(obj: T): T {
	Object.keys(obj).forEach((key: string) =>
		// @ts-expect-error
		obj[key] === undefined ? delete obj[key] : {},
	);
	return obj;
}

/**
 * Determines whether an object has a property with the specified name
 *
 * @see https://eslint.org/docs/rules/no-prototype-builtins
 * @category Object
 */
export function hasOwnProp<T>(obj: T, v: PropertyKey) {
	if (obj == null) return false;
	return Object.hasOwn(obj, v);
}

const _objectIdMap = /* @__PURE__ */ new WeakMap<WeakKey, string>();
/**
 * Get an object's unique identifier
 *
 * Same object will always return the same id
 *
 * Expect argument to be a non-primitive object/array. Primitive values will be returned as is.
 *
 * @category Object
 */
export function objectId(obj: WeakKey): string {
	if (isPrimitive(obj)) return obj as unknown as string;
	if (!_objectIdMap.has(obj)) {
		_objectIdMap.set(obj, randomStr());
	}
	return _objectIdMap.get(obj)!;
}

/**
 * Serialize an object to a JSON-compatible types.
 */
export const serializeObject = <T extends object>(
	data: T,
): SerializeObject<T> => {
	return JSON.parse(JSON.stringify(data));
};

/**
 * Create a new subset object by picking using a given predicate to test if true
 */
export const pickBy = <T>(
	obj: T,
	predicate: (value: T[keyof T]) => boolean,
): Partial<T> => {
	const result: Partial<T> = {};
	for (const key in obj) {
		if (predicate(obj[key])) {
			result[key] = obj[key];
		}
	}
	return result;
};

/**
 * Create a new subset object by omitting using a given predicate to test if true
 */
export const omitBy = <T>(
	obj: T,
	predicate: (value: T[keyof T]) => boolean,
): Partial<T> => {
	return pickBy(obj, (value) => !predicate(value));
};

/**
 * Sort an object's keys in ascending order
 */
export function sortObject<T extends object>(obj: T): T {
	return Object.fromEntries(
		Object.entries(obj).sort(([keyA], [keyB]) => {
			if (keyA < keyB) return -1;
			if (keyA > keyB) return 1;
			return 0;
		}),
	) as T;
}

/**
 * Recursively sort an object's keys in ascending order
 */
export function sortObjectRecursive<T>(obj: T): T {
	if (Array.isArray(obj)) {
		return [...obj].map((item) => sortObjectRecursive(item)) as unknown as T;
	} else if (isPlainObject(obj)) {
		const sortedObj = sortObject(obj as any);
		for (const key in sortedObj) {
			sortedObj[key] = sortObjectRecursive(sortedObj[key]);
		}
		return sortedObj as T;
	}
	return obj;
}
