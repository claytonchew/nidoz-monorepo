import type { Fn } from "./types";
import { remove } from "./array";

export interface SingletonPromiseReturn<T> {
	(): Promise<T>;
	/**
	 * Reset current staled promise.
	 * Await it to have proper shutdown.
	 */
	reset: () => Promise<void>;
}

/**
 * Create singleton promise function
 *
 * @category Promise
 */
export function createSingletonPromise<T>(
	fn: () => Promise<T>,
): SingletonPromiseReturn<T> {
	let _promise: Promise<T> | undefined;

	function wrapper() {
		if (!_promise) _promise = fn();
		return _promise;
	}
	wrapper.reset = async () => {
		const _prev = _promise;
		_promise = undefined;
		if (_prev) await _prev;
	};

	return wrapper;
}

/**
 * Promised `setTimeout`
 *
 * @category Promise
 */
export function sleep(ms: number, callback?: Fn<any>) {
	return new Promise<void>((resolve) =>
		setTimeout(async () => {
			await callback?.();
			resolve();
		}, ms),
	);
}

/**
 * Create a promise lock
 *
 * @category Promise
 * @example
 * ```
 * const lock = createPromiseLock()
 *
 * lock.run(async () => {
 *   await doSomething()
 * })
 *
 * // in anther context:
 * await lock.wait() // it will wait all tasking finished
 * ```
 */
export function createPromiseLock() {
	const locks: Promise<any>[] = [];

	return {
		async run<T = void>(fn: () => Promise<T>): Promise<T> {
			const p = fn();
			locks.push(p);
			try {
				return await p;
			} finally {
				remove(locks, p);
			}
		},
		async wait(): Promise<void> {
			await Promise.allSettled(locks);
		},
		isWaiting() {
			return Boolean(locks.length);
		},
		clear() {
			locks.length = 0;
		},
	};
}

/**
 * Promise with `resolve` and `reject` methods of itself
 */
export interface ControlledPromise<T = void> extends Promise<T> {
	resolve: (value: T | PromiseLike<T>) => void;
	reject: (reason?: any) => void;
}

/**
 * Return a Promise with `resolve` and `reject` methods
 *
 * @category Promise
 * @example
 * ```
 * const promise = createControlledPromise()
 *
 * await promise
 *
 * // in anther context:
 * promise.resolve(data)
 * ```
 */
export function createControlledPromise<T>(): ControlledPromise<T> {
	let resolve: any, reject: any;
	const promise = new Promise<T>((_resolve, _reject) => {
		resolve = _resolve;
		reject = _reject;
	}) as ControlledPromise<T>;
	promise.resolve = resolve;
	promise.reject = reject;
	return promise;
}

/**
 * Return a Promise-like object that defers executing the provided factory
 * until the first interaction (then/catch/finally). The factory is executed
 * at most once.
 *
 * @category Promise
 * @example
 * ```
 * const lazyFoo = lazyPromise(() => foo())
 *
 * // foo() won't run until you await lazyFoo
 * await lazyFoo;
 * ```
 */
export function lazyPromise<T>(factory: () => T | Promise<T>): Promise<T> {
	let started = false;
	let promise: Promise<T> | null = null;

	const start = () => {
		if (!started) {
			started = true;
			try {
				const out = factory();
				promise = Promise.resolve(out);
			} catch (e) {
				promise = Promise.reject(e);
			}
		}
		return promise as Promise<T>;
	};

	return {
		// biome-ignore lint/suspicious/noThenProperty: defined thenable method
		then<TResult1 = T, TResult2 = never>(
			onfulfilled?:
				| ((value: T) => TResult1 | PromiseLike<TResult1>)
				| null
				| undefined,
			onrejected?:
				| ((reason: unknown) => TResult2 | PromiseLike<TResult2>)
				| null
				| undefined,
		): Promise<TResult1 | TResult2> {
			return start().then(onfulfilled ?? undefined, onrejected ?? undefined);
		},
		catch<TResult = never>(
			onrejected?:
				| ((reason: unknown) => TResult | PromiseLike<TResult>)
				| null
				| undefined,
		): Promise<T | TResult> {
			return start().catch(onrejected ?? undefined);
		},
		finally(onfinally?: (() => void) | null | undefined): Promise<T> {
			return start().finally(onfinally ?? undefined);
		},
	} as unknown as Promise<T>;
}
