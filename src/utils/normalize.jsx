/**
 * Turn a string into a URL friendly variant by stripping any weird formatting.
 *
 * - Accents are stripped;
 * - Whitespace is replaced with a hyphen;
 * - The resulting string is lower case.
 *
 * @param {string} input The input string to normalize.
 *
 * @returns {string} The normalized string.
 */
export default function normalize(input) {
  return input
    // Normalize accents. https://stackoverflow.com/a/37511463/1154610
    .normalize('NFD')
    // Replace any white space with hyphens.
    .replace(/\s+/g, '-')
    // Strip off any non-word / hyphen characters.
    .replace(/((?!([\w-]+)).)/g, '')
    // Make it lower case.
    .toLowerCase();
}
