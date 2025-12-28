import { expect, it, describe } from "vitest";
import { parseResidentialUnit } from "./residential-unit";

describe("parseResidentialUnit", () => {
	describe("valid formats with hyphens", () => {
		it("should parse standard format A-01-01", () => {
			const result = parseResidentialUnit("A-01-01");
			expect(result).toEqual({ block: "A", floor: "01", unit: "01" });
		});

		it("should parse format with different blocks", () => {
			expect(parseResidentialUnit("A-01-01")).toEqual({
				block: "A",
				floor: "01",
				unit: "01",
			});
			expect(parseResidentialUnit("B-02-03")).toEqual({
				block: "B",
				floor: "02",
				unit: "03",
			});
			expect(parseResidentialUnit("C-05-06")).toEqual({
				block: "C",
				floor: "05",
				unit: "06",
			});
			expect(parseResidentialUnit("D-07-08")).toEqual({
				block: "D",
				floor: "07",
				unit: "08",
			});
		});

		it("should handle lowercase input", () => {
			const result = parseResidentialUnit("a-01-01");
			expect(result).toEqual({ block: "A", floor: "01", unit: "01" });
		});

		it("should handle input with extra whitespace", () => {
			const result = parseResidentialUnit("  A-01-01  ");
			expect(result).toEqual({ block: "A", floor: "01", unit: "01" });
		});
	});

	describe("4 to 3A conversion", () => {
		it("should convert floor 04 to 3A", () => {
			const result = parseResidentialUnit("A-04-01");
			expect(result).toEqual({ block: "A", floor: "3A", unit: "01" });
		});

		it("should convert unit 04 to 3A", () => {
			const result = parseResidentialUnit("A-01-04");
			expect(result).toEqual({ block: "A", floor: "01", unit: "3A" });
		});

		it("should convert both floor and unit 04 to 3A", () => {
			const result = parseResidentialUnit("A-04-04");
			expect(result).toEqual({ block: "A", floor: "3A", unit: "3A" });
		});

		it("should convert 14 to 13A", () => {
			const result = parseResidentialUnit("A-14-14");
			expect(result).toEqual({ block: "A", floor: "13A", unit: "13A" });
		});

		it("should convert 24 to 23A", () => {
			const result = parseResidentialUnit("A-24-24");
			expect(result).toEqual({ block: "A", floor: "23A", unit: "23A" });
		});

		it("should accept 3A notation directly", () => {
			const result = parseResidentialUnit("A-3A-3A");
			expect(result).toEqual({ block: "A", floor: "3A", unit: "3A" });
		});

		it("should accept mixed 04 and 3A notation", () => {
			const result = parseResidentialUnit("A-04-3A");
			expect(result).toEqual({ block: "A", floor: "3A", unit: "3A" });
		});
	});

	describe("valid formats without hyphens", () => {
		it("should parse A0101 format", () => {
			const result = parseResidentialUnit("A0101");
			expect(result).toEqual({ block: "A", floor: "01", unit: "01" });
		});

		it("should parse A0203 format", () => {
			const result = parseResidentialUnit("A0203");
			expect(result).toEqual({ block: "A", floor: "02", unit: "03" });
		});

		it("should convert 04 in non-hyphenated format", () => {
			const result = parseResidentialUnit("A0104");
			expect(result).toEqual({ block: "A", floor: "01", unit: "3A" });
		});

		it("should convert both parts with 04 in non-hyphenated format", () => {
			const result = parseResidentialUnit("A0404");
			expect(result).toEqual({ block: "A", floor: "3A", unit: "3A" });
		});

		it("should parse A3A13A format (3A floor and 13A unit)", () => {
			const result = parseResidentialUnit("A3A13A");
			expect(result).toEqual({ block: "A", floor: "3A", unit: "13A" });
		});

		it("should parse A13A23A format", () => {
			const result = parseResidentialUnit("A13A23A");
			expect(result).toEqual({ block: "A", floor: "13A", unit: "23A" });
		});

		it("should parse A3A3A format (both 3A)", () => {
			const result = parseResidentialUnit("A3A3A");
			expect(result).toEqual({ block: "A", floor: "3A", unit: "3A" });
		});

		it("should parse AG01 format (Ground floor)", () => {
			const result = parseResidentialUnit("AG01");
			expect(result).toEqual({ block: "A", floor: "G", unit: "01" });
		});

		it("should parse ALG02 format (Lower Ground floor)", () => {
			const result = parseResidentialUnit("ALG02");
			expect(result).toEqual({ block: "A", floor: "LG", unit: "02" });
		});

		it("should parse ASB03 format (Sub-basement floor)", () => {
			const result = parseResidentialUnit("ASB03");
			expect(result).toEqual({ block: "A", floor: "SB", unit: "03" });
		});

		it("should parse AB04 format (Basement floor with unit 04->3A)", () => {
			const result = parseResidentialUnit("AB04");
			expect(result).toEqual({ block: "A", floor: "B", unit: "3A" });
		});
	});

	describe("invalid block validation", () => {
		it("should throw error for block E", () => {
			expect(() => parseResidentialUnit("E-01-01")).toThrow(
				'Invalid block "E". Must be one of: A, B, C, D',
			);
		});

		it("should throw error for block F", () => {
			expect(() => parseResidentialUnit("F-01-01")).toThrow(
				'Invalid block "F". Must be one of: A, B, C, D',
			);
		});

		it("should throw error for numeric block", () => {
			expect(() => parseResidentialUnit("1-01-01")).toThrow(
				'Invalid block "1". Must be one of: A, B, C, D',
			);
		});

		it("should throw error for invalid character block", () => {
			expect(() => parseResidentialUnit("@-01-01")).toThrow(
				'Invalid block "@". Must be one of: A, B, C, D',
			);
		});
	});

	describe("ambiguous format detection", () => {
		it("should throw error for A110 (ambiguous)", () => {
			expect(() => parseResidentialUnit("A110")).toThrow(/[Aa]mbiguous/);
		});

		it("should throw error for A12 (too short)", () => {
			expect(() => parseResidentialUnit("A12")).toThrow(/[Aa]mbiguous/);
		});

		it("should throw error for A1 (too short)", () => {
			expect(() => parseResidentialUnit("A1")).toThrow(
				/[Aa]mbiguous|[Tt]oo short/,
			);
		});

		it("should throw error for non-hyphenated format with single A notation (A3A01)", () => {
			expect(() => parseResidentialUnit("A3A01")).toThrow(/[Aa]mbiguous/);
		});

		it("should throw error for A010 (ambiguous - could be 01-0 or 0-10)", () => {
			expect(() => parseResidentialUnit("A010")).toThrow(/[Aa]mbiguous/);
		});
	});

	describe("invalid format errors", () => {
		it("should throw error for empty string", () => {
			expect(() => parseResidentialUnit("")).toThrow(
				"Input must be a non-empty string",
			);
		});

		it("should throw error for malformed hyphenated format", () => {
			expect(() => parseResidentialUnit("A-01-")).toThrow(/Invalid format/);
		});

		it("should throw error for too many hyphens", () => {
			expect(() => parseResidentialUnit("A-01-01-01")).toThrow();
		});

		it("should throw error for invalid characters in floor/unit", () => {
			expect(() => parseResidentialUnit("A-0X-01")).toThrow(
				/Invalid floor or unit/,
			);
		});

		it("should throw error for non-string input", () => {
			// @ts-expect-error Testing invalid input
			expect(() => parseResidentialUnit(null)).toThrow(
				"Input must be a non-empty string",
			);
		});

		it("should throw error for just a block letter", () => {
			expect(() => parseResidentialUnit("A")).toThrow();
		});
	});

	describe("edge cases", () => {
		it("should handle floor 10", () => {
			const result = parseResidentialUnit("A-10-01");
			expect(result).toEqual({ block: "A", floor: "10", unit: "01" });
		});

		it("should handle unit 10", () => {
			const result = parseResidentialUnit("A-01-10");
			expect(result).toEqual({ block: "A", floor: "01", unit: "10" });
		});

		it("should handle floor 34 (converts to 33A)", () => {
			const result = parseResidentialUnit("A-34-01");
			expect(result).toEqual({ block: "A", floor: "33A", unit: "01" });
		});

		it("should handle different number lengths with hyphens", () => {
			const result = parseResidentialUnit("A-1-1");
			expect(result).toEqual({ block: "A", floor: "1", unit: "1" });
		});

		it("should handle floor/unit 4 (converts to 3A)", () => {
			const result = parseResidentialUnit("A-4-4");
			expect(result).toEqual({ block: "A", floor: "3A", unit: "3A" });
		});
	});

	describe("special floors with hyphens", () => {
		it("should parse A-G-01 format (Ground floor)", () => {
			const result = parseResidentialUnit("A-G-01");
			expect(result).toEqual({ block: "A", floor: "G", unit: "01" });
		});

		it("should parse B-LG-02 format (Lower Ground floor)", () => {
			const result = parseResidentialUnit("B-LG-02");
			expect(result).toEqual({ block: "B", floor: "LG", unit: "02" });
		});

		it("should parse C-SB-03 format (Sub-basement floor)", () => {
			const result = parseResidentialUnit("C-SB-03");
			expect(result).toEqual({ block: "C", floor: "SB", unit: "03" });
		});

		it("should parse D-B-04 format (Basement floor with unit 04->3A)", () => {
			const result = parseResidentialUnit("D-B-04");
			expect(result).toEqual({ block: "D", floor: "B", unit: "3A" });
		});

		it("should parse A-G-3A format (Ground floor with 3A unit)", () => {
			const result = parseResidentialUnit("A-G-3A");
			expect(result).toEqual({ block: "A", floor: "G", unit: "3A" });
		});

		it("should handle lowercase special floor (a-g-01)", () => {
			const result = parseResidentialUnit("a-g-01");
			expect(result).toEqual({ block: "A", floor: "G", unit: "01" });
		});
	});
});
