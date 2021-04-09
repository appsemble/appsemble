/**
 * Return the input data.
 *
 * @param data - The data to return.
 * @returns The input data.
 */
export function identity<T>(data: T): T {
  return data;
}

/**
 * Throw the input data.
 *
 * @param data - The data to throw.
 * @throws The input data.
 */
export function rethrow(data: unknown): never {
  throw data;
}
