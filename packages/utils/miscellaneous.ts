/**
 * Return the input data.
 *
 * @param data The data to return.
 * @returns The input data.
 */
export function identity<T>(data: T): T {
  return data;
}

/**
 * Throw the input data.
 *
 * @param data The data to throw.
 * @throws The input data.
 */
export function rethrow(data: unknown): never {
  throw data;
}

export interface StripNullValuesOptions {
  /**
   * How deep to recurse into objects and arrays to remove null values.
   *
   * @default Infinity
   */
  depth?: number;
}

// eslint-disable-next-line jsdoc/require-returns-check
/**
 * Strip all null, undefined, and empty array values from an object.
 *
 * @param value The value to strip.
 * @param options Additional options for stripping null values.
 * @returns A copy of the input, but with all nullish values removed recursively.
 */
export function stripNullValues(
  value: unknown,
  { depth = Number.POSITIVE_INFINITY, ...options }: StripNullValuesOptions = {},
): unknown {
  if (value == null) {
    return;
  }

  if (typeof value !== 'object') {
    return value;
  }

  if (depth <= 0) {
    return value;
  }

  if (Array.isArray(value)) {
    const result: unknown[] = [];
    for (const val of value) {
      if (val != null) {
        result.push(stripNullValues(val, { depth: depth - 1, ...options }));
      }
    }
    return result;
  }

  const result: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(value)) {
    if (val != null) {
      result[key] = stripNullValues(val, { depth: depth - 1, ...options });
    }
  }
  return result;
}
