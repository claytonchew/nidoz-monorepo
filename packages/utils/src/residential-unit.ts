/**
 * Result of parsing a residential unit number
 */
export interface ResidentialUnit {
	block: string;
	floor: string;
	unit: string;
}

const VALID_BLOCKS = ["A", "B", "C", "D"] as const;
const SPECIAL_FLOORS = ["G", "LG", "SB", "B"] as const;

/**
 * Checks if a value is a special floor (G, LG, SB, B)
 */
function isSpecialFloor(value: string): boolean {
	return SPECIAL_FLOORS.includes(value as any);
}

/**
 * Converts floor/unit numbers where "4" becomes "3A" based on Asian residential convention
 * Examples: "04" -> "3A", "14" -> "13A", "24" -> "23A"
 */
function normalizeNumber(num: string): string {
	// If the number ends with 4, replace it with (n-1)A
	if (num.endsWith("4")) {
		const numValue = parseInt(num, 10);
		const newValue = numValue - 1;
		// Pad to match original length
		const padLength = num.length - 1;
		return newValue.toString().padStart(padLength, "0") + "A";
	}
	return num;
}

/**
 * Parse a residential unit number from user input
 *
 * Supports formats:
 * - With hyphens: A-01-01, A-04-04 (A-3A-3A), A-G-01
 * - Without hyphens: A0101, A3A13A
 *
 * In Asian residential buildings, the number "4" is replaced with "3A"
 * (e.g., 04 becomes 3A, 14 becomes 13A)
 *
 * Special floor types are supported: G (Ground), LG (Lower Ground), SB (Sub-basement), B (Basement)
 *
 * @category String
 * @throws {Error} If the format is invalid or ambiguous
 * @example
 * ```
 * parseResidentialUnit("A-01-01") // { block: "A", floor: "01", unit: "01" }
 * parseResidentialUnit("A0101")   // { block: "A", floor: "01", unit: "01" }
 * parseResidentialUnit("A-04-04") // { block: "A", floor: "3A", unit: "3A" }
 * parseResidentialUnit("A-3A-3A") // { block: "A", floor: "3A", unit: "3A" }
 * parseResidentialUnit("A3A13A")  // { block: "A", floor: "3A", unit: "13A" }
 * parseResidentialUnit("A-G-01")  // { block: "A", floor: "G", unit: "01" }
 * parseResidentialUnit("A-LG-02") // { block: "A", floor: "LG", unit: "02" }
 * ```
 */
export function parseResidentialUnit(input: string): ResidentialUnit {
	if (!input || typeof input !== "string") {
		throw new Error("Input must be a non-empty string");
	}

	const trimmedInput = input.trim().toUpperCase();

	// Extract block (first character)
	const block = trimmedInput[0];

	if (!VALID_BLOCKS.includes(block as any)) {
		throw new Error(
			`Invalid block "${block}". Must be one of: ${VALID_BLOCKS.join(", ")}`,
		);
	}

	const rest = trimmedInput.slice(1);

	// Try to parse format with hyphens: A-01-01 or A-3A-3A
	if (rest.includes("-")) {
		// Remove leading hyphen if present
		const withoutLeadingHyphen = rest.startsWith("-") ? rest.slice(1) : rest;
		const parts = withoutLeadingHyphen.split("-");

		if (parts.length !== 2 || parts[0] === "" || parts[1] === "") {
			throw new Error(
				`Invalid format "${input}". Expected format: {block}-{floor}-{unit}`,
			);
		}

		let [floor, unit] = parts;

		// Validate floor: can be digits with optional 'A', or a special floor (G, LG, SB, B)
		const isValidFloor = (f: string) => /^\d+A?$/.test(f) || isSpecialFloor(f);
		// Validate unit: digits with optional 'A'
		const isValidUnit = (u: string) => /^\d+A?$/.test(u);

		if (!isValidFloor(floor) || !isValidUnit(unit)) {
			throw new Error(
				`Invalid floor or unit in "${input}". Floor must be digits, digits+'A', or special floor (G, LG, SB, B). Unit must be digits or digits+'A'`,
			);
		}

		// Normalize floor/unit if they contain "4" (but not for special floors)
		if (!isSpecialFloor(floor)) {
			floor = normalizeNumber(floor);
		}
		unit = normalizeNumber(unit);

		return { block, floor, unit };
	}

	// Try to parse format without hyphens: A0101, AG01, ALG01, etc.
	// This is ambiguous if the length is odd or doesn't allow clean split
	if (rest.length < 2) {
		throw new Error(
			`Ambiguous or invalid format "${input}". Too short to determine floor and unit`,
		);
	}

	// Check if starts with special floor (G, LG, SB, B)
	for (const specialFloor of SPECIAL_FLOORS) {
		if (rest.startsWith(specialFloor)) {
			const floor = specialFloor;
			const unit = rest.slice(specialFloor.length);

			// Validate unit is valid (digits or digits with A)
			const isValidUnit = (u: string) => /^\d+A?$/.test(u);
			if (!unit || !isValidUnit(unit)) {
				throw new Error(
					`Invalid unit in "${input}". Unit must be digits or digits+'A'`,
				);
			}

			// Normalize unit if it contains "4"
			const normalizedUnit = normalizeNumber(unit);

			return { block, floor, unit: normalizedUnit };
		}
	}

	// Check if contains 'A' - this requires special parsing
	if (rest.includes("A")) {
		// Try to parse format like "3A13A" or "3A01" or "01-3A" (without the hyphen seen by this point)
		// Pattern: Look for two groups of (digits followed by optional 'A')
		// We need to find where the floor ends and unit begins

		// Try to match pattern: (digits + optional A) + (digits + optional A)
		// The challenge is finding the split point
		// Strategy: Look for the second-to-last 'A' or split in the middle if only one 'A'

		const aCount = (rest.match(/A/g) || []).length;

		if (aCount === 2) {
			// Pattern like "3A13A" - find the first 'A', that's the end of floor
			const firstAIndex = rest.indexOf("A");
			const floor = rest.slice(0, firstAIndex + 1); // Include the 'A'
			const unit = rest.slice(firstAIndex + 1);

			// Validate both parts
			const isValidPart = (part: string) => /^\d+A?$/.test(part);
			if (!isValidPart(floor) || !isValidPart(unit)) {
				throw new Error(
					`Ambiguous format "${input}". When using 'A' notation, please use hyphens (e.g., ${block}-XX-XX)`,
				);
			}

			return { block, floor, unit };
		} else if (aCount === 1) {
			// One 'A' - could be in floor or unit, need to figure out the split
			// This is ambiguous - we can't tell if "A3A01" is "3A-01" or something else
			throw new Error(
				`Ambiguous format "${input}". When using 'A' notation with only one 'A', please use hyphens (e.g., ${block}-XX-XX)`,
			);
		} else {
			// More than 2 'A's or 0 'A's shouldn't reach here
			throw new Error(
				`Ambiguous format "${input}". When using 'A' notation, please use hyphens (e.g., ${block}-XX-XX)`,
			);
		}
	}

	// For pure numeric input like "A0101", we need to determine if it's ambiguous
	// Valid cases: even length that can be split equally
	if (rest.length % 2 !== 0) {
		throw new Error(
			`Ambiguous format "${input}". Cannot determine floor and unit boundaries. Use hyphens for clarity`,
		);
	}

	// Check for patterns like "A110" which could be "A-1-10" or "A-11-0"
	// We'll require at least 2 digits per part for non-hyphenated format
	const midpoint = rest.length / 2;
	let floor = rest.slice(0, midpoint);
	let unit = rest.slice(midpoint);

	// Additional ambiguity check: both floor and unit should start with "0" in the standard format
	// (e.g., A0101 is valid, but A1001 or A0110 could be ambiguous)
	if (!floor.startsWith("0") || !unit.startsWith("0")) {
		throw new Error(
			`Ambiguous format "${input}". Cannot determine floor and unit boundaries. Use hyphens for clarity (e.g., ${block}-XX-XX)`,
		);
	}

	// Normalize if they contain "4"
	floor = normalizeNumber(floor);
	unit = normalizeNumber(unit);

	return { block, floor, unit };
}
