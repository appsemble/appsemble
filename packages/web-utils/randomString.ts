const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

/**
 * Generate a cryptographycally secure alphanumeric random string.
 *
 * @param length - The length of the generated string.
 * @returns A cryptographically secure string.
 */
export function randomString(length = 30): string {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return String.fromCharCode(...array.map((n) => chars.charCodeAt(n % chars.length)));
}
