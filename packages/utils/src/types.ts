/**
 * Promise, or maybe not
 */
export type Awaitable<T> = T | PromiseLike<T>;

/**
 * Null or whatever
 */
export type Nullable<T> = T | null | undefined;

/**
 * Array, or not yet
 */
export type Arrayable<T> = T | Array<T>;

/**
 * Function
 */
export type Fn<T = void> = () => T;

/**
 * Constructor
 */
export type Constructor<T = void> = new (...args: any[]) => T;

/**
 * Infers the element type of an array
 */
export type ElementOf<T> = T extends (infer E)[] ? E : never;

/**
 * Checks if a type is a union.
 */
export type IsUnion<T, U = T> = T extends any
	? [U] extends [T]
		? false
		: true
	: never;

/**
 * Extracts required keys from an object type.
 */
export type RequiredKeysOf<BaseType extends object> = Exclude<
	{
		[Key in keyof BaseType]: BaseType extends Record<Key, BaseType[Key]>
			? Key
			: never;
	}[keyof BaseType],
	undefined
>;

/**
 * Checks if an object type has any required keys.
 */
export type HasRequiredKeys<BaseType extends object> =
	RequiredKeysOf<BaseType> extends never ? false : true;

/**
 * Extracts known keys from an object type.
 */
export type KnownKeysOf<T> = {
	[K in keyof T]-?: string extends K
		? never
		: number extends K
			? never
			: symbol extends K
				? never
				: K;
}[keyof T];

/**
 * Extracts known keys from a union of object types.
 */
export type UnionKnownKeys<U> = U extends any ? KnownKeysOf<U> : never;

/**
 * Extracts members of a union type that have a specific key.
 */
export type MembersWithKey<U, K extends PropertyKey> = U extends any
	? K extends keyof U
		? U
		: never
	: never;

/**
 * Literal string type.
 */
export type LiteralString = string & Record<never, never>;

/**
 * Literal number type.
 */
export type LiteralNumber = number & Record<never, never>;

export type IsDigit<C extends string> = C extends
	| "0"
	| "1"
	| "2"
	| "3"
	| "4"
	| "5"
	| "6"
	| "7"
	| "8"
	| "9"
	? true
	: false;

/**
 * Convert kebab-case to camelCase.
 */
export type KebabCaseToCamelCase<S extends string> =
	S extends `${infer P1}-${infer P2}${infer P3}`
		? `${Lowercase<P1>}${Uppercase<P2>}${KebabCaseToCamelCase<P3>}`
		: Lowercase<S>;

/**
 * Convert snake_case to camelCase.
 */
export type SnakeToCamelCase<S extends string> =
	S extends `${infer T}_${infer U}`
		? `${T}${Capitalize<SnakeToCamelCase<U>>}`
		: S;

/**
 * Convert camelCase to snake_case.
 * @note does not split numbers, so "camelCase123" becomes "camel_case123"
 */
export type CamelToSnakeCase<S extends string> =
	S extends `${infer F}${infer R}`
		? IsDigit<F> extends true
			? `${F}${CamelToSnakeCase<R>}` // keep digits as-is
			: F extends Lowercase<F>
				? `${F}${CamelToSnakeCase<R>}` // keep lowercase as-is
				: `_${Lowercase<F>}${CamelToSnakeCase<R>}` // add underscore before uppercase
		: S;

/**
 * Asserts that a string literal is snake_case.
 */
export type AssertSnakeCase<T extends string> = string extends T
	? string
	: T extends Lowercase<T>
		? T extends `${string} ${string}`
			? [`String must be in snake_case. Received: ${T}`]
			: T
		: [`String must be in snake_case. Received: ${T}`];

/**
 * Asserts that a string literal is camelCase.
 */
export type AssertCamelCase<T extends string> = string extends T
	? string
	: T extends ""
		? T
		: T extends `${infer First}${infer _}`
			? First extends Lowercase<First> & isNaN<First>
				? T extends
						| `${string}_${string}`
						| `${string}-${string}`
						| `${string} ${string}`
					? [
							`String must be in camelCase (no underscores, hyphens, or spaces). Received: ${T}`,
						]
					: T
				: [
						`String must be in camelCase (start with lowercase letter). Received: ${T}`,
					]
			: T;

/**
 * Helper type to check if a character is not a number
 */
export type isNaN<T extends string> = T extends
	| "0"
	| "1"
	| "2"
	| "3"
	| "4"
	| "5"
	| "6"
	| "7"
	| "8"
	| "9"
	? never
	: T;

/**
 * Defines an intersection type of all union items.
 *
 * @param U Union of any types that will be intersected.
 * @returns U items intersected
 * @see https://stackoverflow.com/a/50375286/9259330
 */
export type UnionToIntersection<U> = (
	U extends unknown
		? (k: U) => void
		: never
) extends (k: infer I) => void
	? I
	: never;

/**
 * Infers the return type of a function for a specific argument type.
 */
export type ReturnTypeForArg<F, T> = F extends (
	arg: T,
	...rest: any[]
) => infer R
	? R
	: never;

/**
 * Extracts common keys from a union of objects.
 */
export type CommonKeys<U> = {
	[K in keyof U]-?: [U] extends [{ [P in K]?: any }] ? K : never;
}[keyof U];

/**
 * Extracts the value type for a specific key in a union of objects.
 */
export type ValueAt<U, K extends PropertyKey> = U extends unknown
	? K extends keyof U
		? U[K]
		: never
	: never;

/**
 * Extracts keys from an object where the value is `never`.
 */
export type KeysWithNever<T> = {
	[K in keyof T]: [T[K]] extends [never] ? K : never;
}[keyof T];

/**
 * Extracts the intersection of values for a specific key in a union of objects.
 *
 * @template U - Union of objects
 * @template K - Key to extract values from
 * @returns Intersection of values for the specified key
 */
export type ValueIntersect<U, K extends PropertyKey> = UnionToIntersection<
	ValueAt<U, K>
>;

/**
 * Type that can be an array or a function.
 */
export type AnyArrayOrFn = readonly any[] | ((...args: any) => any);

/**
 * Checks if a type is a plain object (not an array or function).
 */
export type IsAllPlainObjects<T> = [T] extends [object]
	? [Extract<T, AnyArrayOrFn>] extends [never]
		? true
		: false
	: false;

/**
 * Extracts common keys and their values from a union of objects.
 */
export type UnionToDissection<U> = {
	// drop keys whose value intersection is never (no common part)
	[K in CommonKeys<U> as ValueIntersect<U, K> extends never
		? never
		: K]: ValueIntersect<U, K>;
};

/**
 * Extracts common keys from a union of objects.
 */
export type DeepUnionToDissection<U> = {
	[K in CommonKeys<U> as ValueIntersect<U, K> extends never
		? never
		: K]: IsAllPlainObjects<NonNullable<ValueAt<U, K>>> extends true
		? DeepUnionToDissection<NonNullable<ValueAt<U, K>>>
		: ValueIntersect<U, K>;
};

/**
 * Infers the arguments type of a function
 */
export type ArgumentsType<T> = T extends (...args: infer A) => any ? A : never;

/**
 * Recursively merges nested objects and arrays, preserving types.
 */
export type MergeInsertions<T> = T extends object
	? { [K in keyof T]: MergeInsertions<T[K]> }
	: T;

/**
 * Deep merge two types, merging nested objects and arrays.
 * Handles primitive types properly to avoid method representation.
 */
export type DeepMerge<F, S> = [F] extends [Primitive]
	? S
	: [S] extends [Primitive]
		? S
		: MergeInsertions<{
				[K in keyof F | keyof S]: K extends keyof S & keyof F
					? DeepMerge<F[K], S[K]>
					: K extends keyof S
						? S[K]
						: K extends keyof F
							? F[K]
							: never;
			}>;

/**
 * Assign target object with assign object where:
 * - Properties from S override properties in T
 * - null values in S make properties undefined in the result (or null if setNullAsNull is true)
 * - undefined values in S are skipped (T values preserved)
 * - Objects are recursively merged
 * - Arrays are overwritten, not merged
 * - __proto__, constructor and prototype properties are ignored (for security)
 *
 * @template T - Base object type
 * @template S - Source object to assign from
 * @template SetNullAsNull - Whether to preserve null values or convert to undefined
 */
export type DeepAssign<T, S, SetNullAsNull extends boolean = false> = [
	// Handle primitive types
	T,
] extends [Primitive]
	? S extends null
		? SetNullAsNull extends true
			? null
			: undefined
		: S extends undefined
			? T
			: S
	: // Handle primitive assign types
		S extends null
		? SetNullAsNull extends true
			? null
			: undefined
		: S extends undefined
			? T
			: [S] extends [Primitive]
				? S
				: // Handle arrays (overwrite, not merge)
					S extends Array<any>
					? S
					: // Merge objects
						MergeInsertions<{
							[K in keyof T | keyof S]: K extends
								| "__proto__"
								| "constructor"
								| "prototype"
								? never
								: K extends keyof S
									? S[K] extends null
										? SetNullAsNull extends true
											? null
											: undefined
										: S[K] extends undefined
											? K extends keyof T
												? T[K]
												: undefined
											: K extends keyof T
												? S[K] extends Array<any>
													? S[K] // Overwrite arrays
													: S[K] extends object
														? T[K] extends object
															? DeepAssign<T[K], S[K], SetNullAsNull>
															: S[K]
														: S[K]
												: S[K]
									: K extends keyof T
										? T[K]
										: never;
						}>;

/**
 * Type that represents the result of removing properties at specific paths from an object
 *
 * @template T - The original object type
 * @template K - Union type of dot-notated paths to omit
 */
export type OmitByPath<T, K extends string> = T extends object
	? K extends `${infer First}.${infer Rest}`
		? {
				[P in keyof T]: P extends First ? OmitByPath<T[P], Rest> : T[P];
			}
		: {
				[P in keyof T as P extends K ? never : P]: T[P];
			}
	: T;

/**
 * Helper type to pick a single path from an object
 */
type PickSinglePath<
	T,
	K extends string,
> = K extends `${infer First}.${infer Rest}`
	? First extends keyof T
		? PickSinglePath<T[First], Rest> extends infer R
			? R extends {}
				? keyof R extends never
					? {}
					: {
							[P in First]: R;
						}
				: {}
			: {}
		: First extends "*"
			? T extends readonly any[]
				? PickSinglePath<T[number], Rest> extends infer R
					? R extends {}
						? keyof R extends never
							? {}
							: R[]
						: {}
					: {}
				: {}
			: T extends readonly any[]
				? First extends `${number}`
					? PickSinglePath<T[number], Rest> extends infer R
						? R extends {}
							? keyof R extends never
								? {}
								: R[]
							: {}
						: {}
					: {}
				: {}
	: K extends "*"
		? T extends readonly any[]
			? T
			: {}
		: K extends keyof T
			? {
					[P in K]: T[P];
				}
			: T extends readonly any[]
				? K extends `${number}`
					? T[number][]
					: {}
				: {};

/**
 * Helper to distribute union type and collect all possible values for a key
 */
type UnionOfValuesForKey<U, K extends PropertyKey> = U extends any
	? K extends keyof U
		? U[K]
		: never
	: never;

/**
 * Helper to merge array types by unioning their element types instead of intersecting
 */
type MergeArrays<T> = T extends any
	? {
			[K in keyof T]: T[K] extends any[]
				? UnionOfValuesForKey<T, K> extends infer ArrayType
					? ArrayType extends any[]
						? ArrayType[number][]
						: never
					: never
				: T[K];
		}
	: never;

/**
 * Helper to merge all picked paths into a single type
 */
type MergePickedPaths<T, K extends string> = [K] extends [never]
	? {}
	: MergeArrays<
			UnionToIntersection<K extends any ? PickSinglePath<T, K> : never>
		>;

/**
 * Type that represents the result of picking properties at specific paths from an object
 *
 * @template T - The original object type
 * @template K - Union type of dot-notated paths to pick
 */
export type PickByPath<T, K extends string> = T extends object
	? MergePickedPaths<T, K>
	: T;

/**
 * Primitive JSON type
 */
export type JSONPrimitive =
	| string
	| number
	| boolean
	| JSONObject
	| null
	| undefined;

/**
 * JSON object type
 */
export type JSONObject = { [key: string]: JSONPrimitive } | JSONObject[];

/**
 * Non-JSON primitive type
 */
export type NonJSONPrimitive = undefined | Function | symbol;

/**
 * Whether a type is `any`
 */
export type IsAny<T> = 0 extends 1 & T ? true : false;

/**
 * Filter keys of an object based on a type
 */
export type FilterKeys<TObj extends object, TFilter> = {
	[TKey in keyof TObj]: TObj[TKey] extends TFilter ? TKey : never;
}[keyof TObj];

/** JSON serialize */
export type Serialize<T> =
	IsAny<T> extends true
		? any
		: T extends JSONPrimitive | undefined
			? T
			: T extends Map<any, any> | Set<any>
				? Record<string, never>
				: T extends NonJSONPrimitive
					? never
					: T extends {
								toJSON(): infer U;
							}
						? U
						: T extends []
							? []
							: T extends [unknown, ...unknown[]]
								? SerializeTuple<T>
								: T extends ReadonlyArray<infer U>
									? (U extends NonJSONPrimitive ? null : Serialize<U>)[]
									: T extends object
										? SerializeObject<T>
										: never;

/**
 * JSON serialize tuples
 */
export type SerializeTuple<T extends [unknown, ...unknown[]]> = {
	[k in keyof T]: T[k] extends NonJSONPrimitive ? null : Serialize<T[k]>;
};

/**
 * JSON serialize objects (not including arrays) and classes
 */
export type SerializeObject<T extends object> = {
	[k in keyof Omit<T, FilterKeys<T, NonJSONPrimitive>>]: Serialize<T[k]>;
};

/**
 * Query value type
 */
export type QueryValue =
	| string
	| number
	| undefined
	| null
	| boolean
	| Array<QueryValue>
	| Record<string, any>;

/**
 * Query object type
 */
export type QueryObject = Record<string, QueryValue | QueryValue[]>;

/**
 * Simplifies an object type to its most basic representation.
 *
 * @example
 * // Input type with intersection
 * type Complex = { a: string } & { b: number };
 *
 * // Using Prettify to simplify
 * type Simple = Prettify<Complex>;
 * // Result: { a: string; b: number }
 */
export type Prettify<T> = {
	[K in keyof T]: T[K];
} & {};

/**
 * Simplifies an object or array type recursively to its most basic representation.
 *
 * @example
 * // Complex nested type
 * type Complex = Array<
 *   SerializeObject<{
 *     data: Array<SerializeObject<{ date: number } & { name: string } & { amount: number }>>;
 *     metadata: { date: Date } & { name: string } & { amount: number };
 *   }>
 * >;
 *
 * // Using Simplify to flatten the structure
 * type Simple = Simplify<Complex>;
 * // Result: {
 * //   data: { date: string; name: string; amount: number }[];
 * //   metadata: { date: string; name: string; amount: number };
 * // }[]
 */
export type Simplify<T> =
	T extends Array<infer Shape>
		? Array<Simplify<Shape>>
		: T extends Date
			? Date
			: T extends object
				? {
						[K in keyof T]: Simplify<T[K]>;
					}
				: T;

/**
 * Extracts the key of a Map type.
 *
 * @example
 * type MapType = Map<"A" | "B" | "C", number>;
 * type Key = KeyOfMap<MapType>; // "A" | "B" | "C"
 */
export type KeyOfMap<M extends Map<unknown, unknown>> =
	M extends Map<infer K, unknown> ? K : never;

/**
 * Makes specified properties of a type required while keeping others as is.
 *
 * @example
 * interface User {
 *   id?: number;
 *   name?: string;
 *   email?: string;
 * }
 *
 * // Make id and email required
 * type RequiredIdEmailUser = Mandatory<User, 'id' | 'email'>;
 * // Result: { id: number; name?: string; email: string; }
 */
export type Mandatory<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>;

/**
 * Makes specified properties of a type optional while keeping others as is.
 *
 * @example
 * interface User {
 *   id: number;
 *   name: string;
 *   email: string;
 * }
 *
 * // Make email optional
 * type OptionalEmailUser = Optional<User, 'email'>;
 * // Result: { id: number; name: string; email?: string; }
 */
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/**
 * Primitive types
 */
export type Primitive =
	| string
	| number
	| boolean
	| bigint
	| symbol
	| undefined
	| null;

/**
 * Buildin types that are not serializable to JSON.
 */
export type Builtin = Primitive | Function | Date | Error | RegExp;

/**
 * Whether a type is `unknown`
 */
export type IsUnknown<Type> =
	IsAny<Type> extends true ? false : unknown extends Type ? true : false;

/**
 * Whether a type is a tuple.
 */
export type IsTuple<Type> = Type extends readonly any[]
	? any[] extends Type
		? never
		: Type
	: never;

/**
 * Recursively make every properties undefineable, but exclude array inner object property types.
 * Array elements themselves remain fully typed (not partial), while the array property can be optional.
 *
 * @example
 * type Schema = {
 *   id: string,
 *   name: string,
 *   children: {
 *     id: string,
 *     name: string,
 *   }[]
 * }
 *
 * type PartialSchema = DeepPartialExcludeArrayInner<Schema>
 * // Result: { id?: string, name?: string, children?: ({ id: string, name: string} | undefined)[] }
 * // Note: children array elements keep their full type, unlike DeepPartial which makes element properties optional
 */
export type DeepPartial<Type> =
	Type extends Exclude<Builtin, Error>
		? Type
		: Type extends Map<infer Keys, infer Values>
			? Map<DeepPartial<Keys>, DeepPartial<Values>>
			: Type extends ReadonlyMap<infer Keys, infer Values>
				? ReadonlyMap<DeepPartial<Keys>, DeepPartial<Values>>
				: Type extends WeakMap<infer Keys, infer Values>
					? WeakMap<DeepPartial<Keys>, DeepPartial<Values>>
					: Type extends Set<infer Values>
						? Set<DeepPartial<Values>>
						: Type extends ReadonlySet<infer Values>
							? ReadonlySet<DeepPartial<Values>>
							: Type extends WeakSet<infer Values>
								? WeakSet<DeepPartial<Values>>
								: Type extends ReadonlyArray<infer Values>
									? Type extends IsTuple<Type>
										? {
												[Key in keyof Type]?: Type[Key];
											}
										: Type extends Array<Values>
											? Array<Values | undefined>
											: ReadonlyArray<Values | undefined>
									: Type extends Promise<infer Value>
										? Promise<DeepPartial<Value>>
										: Type extends {}
											? {
													[Key in keyof Type]?: DeepPartial<Type[Key]>;
												}
											: IsUnknown<Type> extends true
												? unknown
												: Partial<Type>;

/**
 * Recursively make every properties undefineable. (including array inner object property types)
 *
 * @example
 * type Schema = {
 *   id: string,
 *   name: string,
 *   children: {
 *     id: string,
 *     name: string,
 *   }[]
 * }
 *
 * type PartialSchema = DeepPartial<Schema>
 * // Result: { id?: string, name?: string, children: ({ id?: string, name?: string} | {} | undefined)[] }
 */
export type DeepPartialIncludeArrInner<Type> =
	Type extends Exclude<Builtin, Error>
		? Type
		: Type extends Map<infer Keys, infer Values>
			? Map<
					DeepPartialIncludeArrInner<Keys>,
					DeepPartialIncludeArrInner<Values>
				>
			: Type extends ReadonlyMap<infer Keys, infer Values>
				? ReadonlyMap<
						DeepPartialIncludeArrInner<Keys>,
						DeepPartialIncludeArrInner<Values>
					>
				: Type extends WeakMap<infer Keys, infer Values>
					? WeakMap<
							DeepPartialIncludeArrInner<Keys>,
							DeepPartialIncludeArrInner<Values>
						>
					: Type extends Set<infer Values>
						? Set<DeepPartialIncludeArrInner<Values>>
						: Type extends ReadonlySet<infer Values>
							? ReadonlySet<DeepPartialIncludeArrInner<Values>>
							: Type extends WeakSet<infer Values>
								? WeakSet<DeepPartialIncludeArrInner<Values>>
								: Type extends ReadonlyArray<infer Values>
									? Type extends IsTuple<Type>
										? {
												[Key in keyof Type]?: DeepPartialIncludeArrInner<
													Type[Key]
												>;
											}
										: Type extends Array<Values>
											? Array<DeepPartialIncludeArrInner<Values> | undefined>
											: ReadonlyArray<
													DeepPartialIncludeArrInner<Values> | undefined
												>
									: Type extends Promise<infer Value>
										? Promise<DeepPartialIncludeArrInner<Value>>
										: Type extends {}
											? {
													[Key in keyof Type]?: DeepPartialIncludeArrInner<
														Type[Key]
													>;
												}
											: IsUnknown<Type> extends true
												? unknown
												: Partial<Type>;
