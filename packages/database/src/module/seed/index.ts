import type { DrizzleTursoClient, DrizzleTursoTransaction } from "../client";
import type { SeedConfig, SeedModule, SeedStep } from "./types";

class Seed implements SeedModule {
	private jobLogs: Record<string, boolean> = {};
	private testLogs: Record<string, boolean> = {};

	constructor(private config: SeedConfig) {}

	private async runSteps(tx: DrizzleTursoTransaction, steps: SeedStep[]) {
		for (const step of steps) {
			try {
				await step.seed(tx);
			} catch (error) {
				if (!step.continueOnError) {
					throw error;
				}
				console.error(
					`Error in step${step?.name ? " " + step.name : ""}:`,
					error,
				);
				console.error("Ignoring error and continuing...");
			}
		}
	}

	private async runJob(
		tx: DrizzleTursoTransaction,
		jobId: string,
		continueOnError?: boolean,
	) {
		if (this.jobLogs[jobId]) {
			return;
		}

		console.info(`Running job: ${jobId}`);

		const job = this.config.seed.jobs![jobId];

		if (job!.dependsOn) {
			for (const dependency of job.dependsOn) {
				const dependedJob = this.config.seed.jobs![dependency];
				try {
					await this.runJob(tx, dependency, job.continueOnError);
				} catch (error) {
					if (
						!dependedJob.continueOnError &&
						!job.continueOnError &&
						!continueOnError
					) {
						throw error;
					}

					console.error(`Error in job ${dependency}:`, error);
					console.error("Ignoring error and continuing...");
				}
			}
		}

		try {
			await this.runSteps(tx, job.steps);
		} catch (error) {
			if (!job.continueOnError) {
				throw error;
			}
			console.error(`Error in job ${jobId}:`, error);
			console.error("Ignoring error and continuing...");
		} finally {
			this.jobLogs[jobId] = true;
		}
		console.info("");
	}

	private async runTest(
		tx: DrizzleTursoTransaction,
		testId: string,
		continueOnError?: boolean,
	) {
		if (this.testLogs[testId]) {
			return;
		}

		console.info(`Running test: ${testId}`);

		const test = this.config.seed.tests![testId];

		if (test.dependsOn) {
			for (const dependency of test.dependsOn) {
				const dependedTest = this.config.seed.tests![dependency];
				try {
					await this.runTest(tx, dependency, test.continueOnError);
				} catch (error) {
					if (
						!dependedTest.continueOnError &&
						!test.continueOnError &&
						!continueOnError
					) {
						throw error;
					}
					console.error(`Error in test ${dependency}:`, error);
					console.error("Ignoring error and continuing...");
				}
			}
		}

		try {
			await this.runSteps(tx, test.steps);
		} catch (error) {
			if (!test.continueOnError) {
				throw error;
			}
			console.error(`Error in test ${testId}:`, error);
			console.error("Ignoring error and continuing...");
		} finally {
			this.testLogs[testId] = true;
		}
	}

	async run(db: DrizzleTursoClient, { seedTests }: { seedTests?: boolean }) {
		await db.transaction(async (tx) => {
			if (this.config.seed.jobs) {
				for (const jobId in this.config.seed.jobs) {
					await this.runJob(
						tx,
						jobId,
						this.config.seed.jobs?.[jobId]?.continueOnError,
					);
				}
			}

			if (seedTests === true) {
				for (const testId in this.config.seed.tests) {
					await this.runTest(
						tx,
						testId,
						this.config.seed.tests?.[testId]?.continueOnError,
					);
				}
			}
		});
	}
}

function createTursoSeeder(config: SeedConfig) {
	return new Seed(config);
}

export { Seed, createTursoSeeder };
export * from "./types";
