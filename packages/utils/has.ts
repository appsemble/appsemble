/**
 * Check if the target has an own property named after the key.
 *
 * @param target The target that should have the key. Null values are also accepted.
 * @param key The key to check for on the target.
 * @returns Whether or not the key exists on the target.
 */
export function has(target: object | null | undefined, key: string): boolean {
  return target != null && target !== undefined && Object.hasOwnProperty.call(target, key);
}
