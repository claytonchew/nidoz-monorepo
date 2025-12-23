/**
 * Get the current time in milliseconds since the Unix epoch.
 */
export const unixTime = () => +Date.now();

/**
 * Get the current time in seconds since the Unix epoch.
 */
export const epochTime = () => Math.floor(Date.now() / 1000);
