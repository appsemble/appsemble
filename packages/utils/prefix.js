/**
 * If the prefix is truthy, concatenate prefix and string. Otherwise, return string.
 *
 * @param {string} string The string to add a conditional prefix to.
 * @param {string} p The string to add as a prefix.
 *
 * @returns {string} The prefixed or unprefixed string.
 */
export default function prefix(string, p) {
  return p ? p + string : string;
}
