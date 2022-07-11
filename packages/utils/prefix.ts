/**
 * If the prefix is truthy, concatenate prefix and string. Otherwise, return string.
 *
 * @param string The string to add a conditional prefix to.
 * @param p The string to add as a prefix.
 * @returns The prefixed or unprefixed string.
 */
export function prefix(string: string, p: string): string {
  return p ? p + string : string;
}
