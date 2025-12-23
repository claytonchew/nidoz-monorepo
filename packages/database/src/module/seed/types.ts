import type { DrizzleTursoClient, DrizzleTursoTransaction } from "../client";

export interface SeedModule {
	run: (
		db: DrizzleTursoClient,
		{ seedTests }: { seedTests?: boolean },
	) => Promise<void>;
}

export interface SeedStep {
	name?: string;
	seed: (tx: DrizzleTursoTransaction) => Promise<void> | void;
	continueOnError?: boolean;
}

export function defineStep(
	fn: SeedStep["seed"],
	config?: { name?: string; continueOnError?: boolean },
) {
	return {
		seed: fn,
		name: config?.name,
		continueOnError: config?.continueOnError,
	} as SeedStep;
}

export interface Job {
	steps: SeedStep[];
	dependsOn?: string[];
	continueOnError?: boolean;
}

export function defineJob(
	steps: SeedStep[],
	config?: { dependsOn?: string[]; continueOnError?: boolean },
) {
	return {
		steps,
		dependsOn: config?.dependsOn,
		continueOnError: config?.continueOnError,
	} as Job;
}

export type SeedRunner = {
	jobs?: Record<string, Job>;
	tests?: Record<string, Job>;
};

export type SeedConfig = {
	includeTest?: boolean;
	resetVersion?: number;
	seed: SeedRunner;
};

export function defineSeedConfig(config: SeedConfig): SeedConfig {
	return config;
}
