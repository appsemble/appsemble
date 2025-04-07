/**
 * Turn a string into a URL friendly variant by stripping any weird formatting.
 *
 * - Accents are stripped;
 * - Non-alphanumeric is replaced with a hyphen;
 * - The resulting string is lower case.
 *
 * @param input The input string to normalize.
 * @param stripTrailingHyphen Strip a trailing hyphen. Disable for example when processing user
 *   input directly while the user is typing.
 * @returns The normalized string.
 */
export function normalize(input: string, stripTrailingHyphen = true): string {
  const normalized = input
    // Normalize accents. https://stackoverflow.com/a/37511463/1154610
    .normalize('NFD')
    .replaceAll(/[\u0300-\u036F]/g, '')
    // Make it lower case.
    .toLowerCase()
    // Replace any non-alphanumeric with single hyphens them at the start.
    .replaceAll(/[^\da-z]+/g, (match, index) => (index ? '-' : ''));
  return stripTrailingHyphen ? normalized.replace(/-$/, '') : normalized;
}
