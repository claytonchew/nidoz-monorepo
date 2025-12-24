/**
 * Result of parsing a residential unit number
 */
export interface ResidentialUnit {
	block: string;
	floor: string;
	unit: string;
}

const VALID_BLOCKS = ["A", "B", "C", "D"] as const;

/**
 * Converts floor/unit numbers where "4" becomes "3A" based on Asian residential convention
 * Examples: "04" -> "3A", "14" -> "13A", "24" -> "23A"
 */
function normalizeNumber(num: string): string {
	// If the number ends with 4, replace it with (n-1)A
	if (num.endsWith("4")) {
		const withoutFour = num.slice(0, -1);
		const numValue = parseInt(num, 10);
		const newValue = numValue - 1;
		// Pad to match original length
		const padLength = num.length - 1;
		return newValue.toString().padStart(padLength, "0") + "A";
	}
	return num;
}

/**
 * Denormalizes a number with "A" suffix back to "4"
 * Examples: "3A" -> "04", "13A" -> "14"
 */
function denormalizeNumber(num: string): string {
	if (num.endsWith("A")) {
		const withoutA = num.slice(0, -1);
		const numValue = parseInt(withoutA, 10);
		const newValue = numValue + 1;
		// Pad to match original length
		const padLength = withoutA.length;
		return newValue.toString().padStart(padLength, "0");
	}
	return num;
}

/**
 * Parse a residential unit number from user input
 *
 * Supports formats:
 * - With hyphens: A-01-01, A-04-04 (A-3A-3A)
 * - Without hyphens: A0101
 *
 * In Asian residential buildings, the number "4" is replaced with "3A"
 * (e.g., 04 becomes 3A, 14 becomes 13A)
 *
 * @category String
 * @throws {Error} If the format is invalid or ambiguous
 * @example
 * ```
 * parseResidentialUnit("A-01-01") // { block: "A", floor: "01", unit: "01" }
 * parseResidentialUnit("A0101")   // { block: "A", floor: "01", unit: "01" }
 * parseResidentialUnit("A-04-04") // { block: "A", floor: "3A", unit: "3A" }
 * parseResidentialUnit("A-3A-3A") // { block: "A", floor: "3A", unit: "3A" }
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

		// Validate that floor and unit are valid (digits or ending with A)
		const isValidPart = (part: string) => /^\d+A?$/.test(part);
		if (!isValidPart(floor) || !isValidPart(unit)) {
			throw new Error(
				`Invalid floor or unit in "${input}". Must contain only digits or digits followed by 'A'`,
			);
		}

		// Normalize if they contain "4"
		floor = normalizeNumber(floor);
		unit = normalizeNumber(unit);

		return { block, floor, unit };
	}

	// Try to parse format without hyphens: A0101
	// This is ambiguous if the length is odd or doesn't allow clean split
	if (rest.length < 2) {
		throw new Error(
			`Ambiguous or invalid format "${input}". Too short to determine floor and unit`,
		);
	}

	// Check if contains 'A' - this makes it more complex
	if (rest.includes("A")) {
		// We need to figure out where floor ends and unit begins
		// This is complex because "A3A01" could be parsed multiple ways
		throw new Error(
			`Ambiguous format "${input}". When using 'A' notation, please use hyphens (e.g., ${block}-XX-XX)`,
		);
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
