import { describe, expect, expectTypeOf, it } from "vitest";
import {
	assignObject,
	deepMerge,
	deepMergeWithArray,
	objectId,
	objectMap,
	objectOmit,
	objectPick,
} from "./object";

it("objectMap", () => {
	expect(objectMap({}, (...args) => args)).toEqual({});

	expect(
		objectMap({ a: 1, b: 2 }, (k, v) => [
			k.toString().toUpperCase(),
			v.toString(),
		]),
	).toEqual({ A: "1", B: "2" });

	expect(objectMap({ a: 1, b: 2 }, () => undefined)).toEqual({});

	expect(
		objectMap({ a: 1, b: 2 }, (k, v) => (k === "a" ? undefined : [k, v])),
	).toEqual({ b: 2 });

	expect(objectMap({ a: 1, b: 2 }, (k, v) => [v, k])).toEqual({
		1: "a",
		2: "b",
	});
});

describe("deepMerge", () => {
	it("should merge Objects and all nested Ones", () => {
		const obj1 = { a: { a1: "A1" }, c: "C", d: {} };
		const obj2 = { a: { a2: "A2" }, b: { b1: "B1" }, d: null } as any;
		const obj3 = {
			a: { a1: "A1", a2: "A2" },
			b: { b1: "B1" },
			c: "C",
			d: null,
		};
		expect(deepMerge({}, obj1, obj2)).toEqual(obj3);
	});
	it("should behave like Object.assign on the top level", () => {
		const obj1 = { a: { a1: "A1" }, c: "C" };
		const obj2 = { a: undefined, b: { b1: "B1" } };
		const merged = deepMerge(obj1, obj2);
		expect(merged).toEqual(Object.assign({}, obj1, obj2));
	});
	it("should not merge array values, just override", () => {
		const obj1 = { a: ["A", "B"] };
		const obj2 = { a: ["C"], b: ["D"] };
		expect(deepMerge({}, obj1, obj2)).toEqual({ a: ["C"], b: ["D"] });
	});
	it("should overide plain value", () => {
		const obj1 = { a: { x: 1 } };
		const obj2 = { a: { x: { f: 2 } } } as any;
		expect(deepMerge({}, obj1, obj2)).toEqual({ a: { x: { f: 2 } } });
	});

	it("prototype pollution 1", () => {
		const obj = {} as any;
		const obj2 = {} as any;
		const payload = JSON.parse('{"__proto__":{"polluted":"Polluted!"}}');

		expect(obj.polluted).toBeUndefined();
		expect(obj2.polluted).toBeUndefined();
		deepMerge(obj, payload);
		expect(obj.polluted).toBeUndefined();
		expect(obj2.polluted).toBeUndefined();
	});
});

describe("deepMergeWithArray", () => {
	it("should merge array values", () => {
		const obj1 = { a: ["A", "B"] };
		const obj2 = { a: ["C"], b: ["D"] };
		expect(deepMergeWithArray({}, obj1, obj2)).toEqual({
			a: ["A", "B", "C"],
			b: ["D"],
		});
	});
});

describe("assignObject", () => {
	it("should assign with two simple objects", () => {
		const base = { a: 1, b: 2 };
		const assign = { b: 3, c: 4 };
		const result = assignObject(base, assign);

		expect(result).toEqual({ a: 1, b: 3, c: 4 });
		// Ensure original objects weren't modified
		expect(base).toEqual({ a: 1, b: 2 });
		expect(assign).toEqual({ b: 3, c: 4 });
	});

	it("should deep assign with nested objects", () => {
		const base = { a: 1, b: { x: 1, y: 2 } };
		const assign = { b: { y: 3, z: 4 } };
		const result = assignObject(base, assign);

		expect(result).toEqual({ a: 1, b: { x: 1, y: 3, z: 4 } });
		// Ensure deep properties of original objects weren't modified
		expect(base.b).toEqual({ x: 1, y: 2 });
	});

	it("should handle null values", () => {
		const base = { a: 1, b: { x: 1 } };
		const assign = { a: null, b: null };
		const result = assignObject(base, assign);

		expect(result).toEqual({});
	});

	it("should handle null values by explicitly set null", () => {
		const base = { a: 1, b: { x: 1 } };
		const assign = { a: null, b: null };
		const result = assignObject(base, assign, { setNullAsNull: true });
		expect(result).toEqual({ a: null, b: null });
	});

	it("should handle null values by explicitly set null on nested objects", () => {
		const base = { b: { e: 1, c: 1 } };
		const assign = { a: 1, b: { c: null, d: 2 } };
		const result = assignObject(base, assign, { setNullAsNull: true });
		expect(result).toEqual({ b: { e: 1, c: null, d: 2 }, a: 1 });
	});

	it("should ignore undefined values", () => {
		const base = { a: 1, b: 2 };
		const assign = { a: undefined, c: 3 };
		const result = assignObject(base, assign);

		expect(result).toEqual({ a: 1, b: 2, c: 3 });
	});

	it("should ignore __proto__ and constructor properties", () => {
		const base = { a: 1 };
		const assign = {
			__proto__: { malicious: true },
			constructor: Function,
			prototype: "malicious",
		};
		const result = assignObject(base, assign);

		expect(result).toEqual({ a: 1 });
		// @ts-expect-error simulating invalid assignment
		expect(result.malicious).toBeUndefined();
		expect(Object.getPrototypeOf(result)).toEqual(Object.getPrototypeOf({}));
	});

	it("should return a copy of base object when assign object is not a plain object", () => {
		const base = { a: 1 };
		const nonObjectValues = [null, undefined, 1, "string", [], new Date()];

		nonObjectValues.forEach((value) => {
			// @ts-expect-error simulating invalid assignment
			const result = assignObject(base, value);
			expect(result).toEqual({ a: 1 });
			expect(result).not.toBe(base); // Should be a new object
		});
	});

	it("should overwrite non-object properties with object properties", () => {
		const base = { a: 1, b: "string" };
		const assign = { a: { nested: true }, b: { nested: true } };
		const result = assignObject(base, assign);

		expect(result).toEqual({
			a: { nested: true },
			b: { nested: true },
		});
	});

	it("should overwrite object properties with non-object properties", () => {
		const base = { a: { nested: true }, b: { nested: true } };
		const assign = { a: 1, b: "string" };
		const result = assignObject(base, assign);

		expect(result).toEqual({ a: 1, b: "string" });
	});

	it("should handle complex nested objects", () => {
		const base = {
			user: {
				name: "John",
				preferences: {
					theme: "light",
					notifications: {
						email: true,
						push: false,
					},
				},
			},
			settings: {
				global: {
					language: "en",
				},
			},
		};

		const assign = {
			user: {
				age: 30,
				preferences: {
					notifications: {
						push: true,
						sms: false,
					},
				},
			},
			settings: {
				global: {
					timezone: "UTC",
				},
				security: {
					twoFactor: true,
				},
			},
		};

		const result = assignObject(base, assign);

		expect(result).toEqual({
			user: {
				name: "John",
				age: 30,
				preferences: {
					theme: "light",
					notifications: {
						email: true,
						push: true,
						sms: false,
					},
				},
			},
			settings: {
				global: {
					language: "en",
					timezone: "UTC",
				},
				security: {
					twoFactor: true,
				},
			},
		});
	});

	it("should handle arrays as assign values (overwrite, not merge)", () => {
		const base = { items: [1, 2, 3] };
		const assign = { items: ["1", "2", "3"] };
		const result = assignObject(base, assign);

		expect(result.items).toEqual(["1", "2", "3"]);
	});

	it("should handle functions in objects", () => {
		const fn1 = () => "base";
		const fn2 = () => "assign";

		const base = { func: fn1 };
		const assign = { func: fn2 };
		const result = assignObject(base, assign);

		expect(result.func).toBe(fn2);
		// @ts-expect-error
		expect(result.func()).toBe("assign");
	});

	it("should handle Date objects (overwrite, not merge)", () => {
		const date1 = new Date("2023-01-01");
		const date2 = new Date("2023-02-01");

		const base = { date: date1 };
		const assign = { date: date2 };
		const result = assignObject(base, assign);

		expect(result.date).toBe(date2);
	});

	it("should handle multiple levels of recursion", () => {
		const base = {
			level1: {
				level2: {
					level3: {
						level4: {
							value: "base",
						},
					},
				},
			},
		};

		const assign = {
			level1: {
				level2: {
					level3: {
						level4: {
							value: "assign",
						},
					},
				},
			},
		};

		const result = assignObject(base, assign);

		expect(result.level1.level2.level3.level4.value).toBe("assign");
	});
});

describe("objectOmit", () => {
	it("should remove a top-level property", () => {
		const obj = { a: 1, b: 2, c: 3 };
		const result = objectOmit(obj, ["b"]);

		expect(result).toEqual({ a: 1, c: 3 });
		// Ensure original object wasn't modified
		expect(obj).toEqual({ a: 1, b: 2, c: 3 });
	});

	it("should remove multiple top-level properties", () => {
		const obj = { a: 1, b: 2, c: 3, d: 4 };
		const result = objectOmit(obj, ["a", "c"]);

		expect(result).toEqual({ b: 2, d: 4 });
	});

	it("should remove a nested property using dot notation", () => {
		const obj = {
			user: {
				name: "John",
				details: {
					age: 30,
					email: "john@example.com",
				},
			},
			settings: { theme: "dark" },
		};

		const result = objectOmit(obj, ["user.details.email"]);

		expect(result).toEqual({
			user: {
				name: "John",
				details: {
					age: 30,
				},
			},
			settings: { theme: "dark" },
		});
	});

	it("should remove multiple nested properties", () => {
		const obj = {
			a: {
				b: { c: 1, d: 2 },
				e: 3,
			},
			f: 4,
		};

		const result = objectOmit(obj, ["a.b.c", "a.e", "f"]);

		expect(result).toEqual({
			a: {
				b: { d: 2 },
			},
		});
	});

	it("should handle non-existent properties gracefully", () => {
		const obj = { a: 1, b: { c: 2 } };
		const result = objectOmit(obj, ["d", "b.x", "b.c.d"]);

		// Should not change anything since paths don't exist
		expect(result).toEqual({ a: 1, b: { c: 2 } });
	});

	it("should handle empty keys array", () => {
		const obj = { a: 1, b: 2 };
		const result = objectOmit(obj, []);

		// Should return a clone of the original object
		expect(result).toEqual(obj);
		expect(result).not.toBe(obj);
	});

	it("should handle nested arrays correctly", () => {
		const obj = {
			items: [
				{ id: 1, name: "Item 1" },
				{ id: 2, name: "Item 2" },
			],
		};

		// Remove the name property from the second item
		const result = objectOmit(obj, ["items.1.name"]);

		expect(result).toEqual({
			items: [{ id: 1, name: "Item 1" }, { id: 2 }],
		});
	});
});

describe("objectPick", () => {
	it("should pick a top-level property", () => {
		const obj = { a: 1, b: 2, c: 3 };
		const result = objectPick(obj, ["b"]);

		expect(result).toEqual({ b: 2 });
		expectTypeOf(result).toEqualTypeOf<{ b: number }>();

		// Ensure original object wasn't modified
		expect(obj).toEqual({ a: 1, b: 2, c: 3 });
	});

	it("should pick multiple top-level properties", () => {
		const obj = { a: 1, b: 2, c: 3, d: 4 };
		const result = objectPick(obj, ["a", "c"]);

		expect(result).toEqual({ a: 1, c: 3 });
		expectTypeOf(result).toEqualTypeOf<{ a: number; c: number }>();
	});

	it("should pick a nested property using dot notation", () => {
		const obj = {
			user: {
				name: "John",
				details: {
					age: 30,
					email: "john@example.com",
				},
			},
			settings: { theme: "dark" },
		};

		const result = objectPick(obj, ["user.details.email"]);
		expectTypeOf(result).toEqualTypeOf<{
			user: { details: { email: string } };
		}>();

		expect(result).toEqual({
			user: {
				details: {
					email: "john@example.com",
				},
			},
		});
	});

	it("should pick multiple nested properties", () => {
		const obj = {
			a: {
				b: { c: 1, d: 2 },
				e: 3,
			},
			f: 4,
		};

		const result = objectPick(obj, ["a.b.c", "a.b.d", "f"]);
		expectTypeOf(result).toEqualTypeOf<{
			a: { b: { c: number; d: number } };
			f: number;
		}>();

		expect(result).toEqual({
			a: {
				b: { c: 1, d: 2 },
			},
			f: 4,
		});
	});

	it("should union if picked conflicted nested properties", () => {
		const obj = {
			a: {
				b: { c: 1, d: 2 },
				e: 3,
			},
			f: 4,
		};

		const result = objectPick(obj, ["a.b", "a.b.d"]);
		expectTypeOf(result).toEqualTypeOf<{
			a: { b: { c: number; d: number } };
		}>();

		expect(result).toEqual({
			a: {
				b: { c: 1, d: 2 },
			},
		});
	});

	it("should handle non-existent properties gracefully", () => {
		const obj = { a: 1, b: { c: 2 } };
		const result = objectPick(obj, ["d", "b.x", "b.c.d"]);

		// Should return an empty object since none of the paths exist
		expect(result).toEqual({});
		expectTypeOf(result).toEqualTypeOf<{}>();
	});

	it("should handle empty keys array", () => {
		const obj = { a: 1, b: 2 };
		const result = objectPick(obj, []);

		// Should return a clone of an empty object
		expect(result).toEqual({});
		expectTypeOf(result).toEqualTypeOf<{}>();

		expect(result).not.toBe(obj);
	});

	it("should handle nested arrays correctly", () => {
		const obj = {
			items: [
				{ id: 1, name: "Item 1" },
				{ id: 2, name: "Item 2" },
			],
		};

		// Pick the name property from the second item
		const result = objectPick(obj, ["items.1.name"]);
		expectTypeOf(result).toEqualTypeOf<{ items: { name: string }[] }>();

		expect(result).toEqual({
			items: [{ name: "Item 2" }],
		});
	});

	it("should handle multiple nested arrays correctly", () => {
		const obj = {
			items: [
				{ id: 1, name: "Item 1" },
				{ id: 2, name: "Item 2" },
			],
		};

		// Pick the name property from the second item
		const result = objectPick(obj, ["items.0.id", "items.1.name"]);
		expectTypeOf(result).toMatchTypeOf<{
			items: ({ id: number } | { name: string })[];
		}>();

		expect(result).toEqual({
			items: [{ id: 1 }, { name: "Item 2" }],
		});
	});

	it("should match asterisk (*) pattern to pick specific property in array or object correctly", () => {
		const obj = {
			items: [
				{ id: 1, name: "Clayton", email: "clayton@qbix.tech" },
				{ id: 2, name: "Ronnie", email: "ronnie@qbix.tech" },
			],
		};

		// Pick the name property from the second item
		const result = objectPick(obj, ["items.*.name"]);
		expectTypeOf(result).toMatchTypeOf<{ items: { name: string }[] }>();

		expect(result).toEqual({
			items: [{ name: "Clayton" }, { name: "Ronnie" }],
		});
	});

	it("should match asterisk (*) pattern to pick multiple properties array or object correctly", () => {
		const obj = {
			items: [
				{ id: 1, name: "Clayton", email: "clayton@qbix.tech" },
				{ id: 2, name: "Ronnie", email: "ronnie@qbix.tech" },
			],
		};

		// Pick the name property from the second item
		const result = objectPick(obj, ["items.*.name", "items.*.email"]);
		expectTypeOf(result).toMatchTypeOf<{
			items: { name: string; email: string }[];
		}>();

		expect(result).toEqual({
			items: [
				{ name: "Clayton", email: "clayton@qbix.tech" },
				{ name: "Ronnie", email: "ronnie@qbix.tech" },
			],
		});
	});
});

it("objectId", () => {
	const foo = { a: 1, b: 2 };
	const bar = new Map();
	const baz = /foo/g;

	expect(objectId(foo)).toBe(objectId(foo));
	expect(objectId(bar)).toBe(objectId(bar));
	expect(objectId(baz)).toBe(objectId(baz));

	expect(objectId(foo)).not.toBe(objectId(bar));
	expect(objectId({})).not.toBe(objectId({}));
	expect(objectId([])).not.toBe(objectId([]));
	expect(objectId(/a/)).not.toBe(objectId(/a/));
});
