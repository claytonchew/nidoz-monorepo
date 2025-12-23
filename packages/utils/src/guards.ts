/**
 * Type guard to filter out null-ish values
 *
 * @category Guards
 * @example array.filter(notNullish)
 */
function notNullish<T>(v: T | null | undefined): v is NonNullable<T> {
	return v != null;
}

/**
 * Type guard to filter out null values
 *
 * @category Guards
 * @example array.filter(noNull)
 */
function noNull<T>(v: T | null): v is Exclude<T, null> {
	return v !== null;
}

/**
 * Type guard to filter out null-ish values
 *
 * @category Guards
 * @example array.filter(notUndefined)
 */
function notUndefined<T>(v: T): v is Exclude<T, undefined> {
	return v !== undefined;
}

/**
 * Type guard to filter out falsy values
 *
 * @category Guards
 * @example array.filter(isTruthy)
 */
function isTruthy<T>(v: T): v is NonNullable<T> {
	return Boolean(v);
}

/**
 * Checks if a value has a nullish value.
 */
const isNullish = (value: unknown): value is null | undefined | "" => {
	return (
		value === null || value === undefined || (value as string).trim() === ""
	);
};

export { notNullish, noNull, notUndefined, isTruthy, isNullish };
