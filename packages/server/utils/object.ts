/**
 * Get an object value from a case insensitive key.
 *
 * If the input has multiple keys that match the given key, an error is thrown.
 *
 * @param obj The object to get the value from.
 * @param key The case insensitive object key whose value to get.
 * @returns The value that matches the case key.
 */
export function getCaseInsensitive(obj: unknown, key: string): unknown {
  let found: string | undefined;
  let result: unknown;

  const keyLower = key.toLowerCase();
  if (typeof obj !== 'object') {
    throw new TypeError(`Expected an object, got: ${obj}`);
  }
  for (const objKey in obj) {
    if (objKey.toLowerCase() !== keyLower) {
      continue;
    }
    if (found) {
      throw new Error(`Found duplicate object keys: ${found}, ${objKey}`);
    }
    found = objKey;
    result = (obj as Record<string, unknown>)[objKey];
  }

  return result;
}
