/**
 * Convert a base64 encoded string to a Uint8Array.
 *
 * @param base64String - The base64 input string. This may be a string encoded for use in a URL.
 * This means `-` may be used to replace `+` and `_` to replace `/`.
 * @returns the base64 content as a Uint8Array.
 */
export function urlB64ToUint8Array(base64String: string): Uint8Array {
  const base64 = base64String.replace(/-/g, '+').replace(/_/g, '/');

  return Uint8Array.from(atob(base64), (char) => char.charCodeAt(0));
}
