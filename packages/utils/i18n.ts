/**
 * Sort locales by specificity
 *
 * The languages are sorted in a way that more specific languages are preferred over less specific
 * ones, but languages are never sorted before completely different languages.
 *
 * All languages are converted to lower case for convenience.
 *
 * For examples, see the test cases.
 *
 * @param languages The languages to sort. For example `navigator.languages`.
 * @returns A sorted list of lower case languages in order of preference.
 */
export function sortLocales(languages: readonly string[]): string[] {
  const copy = languages.map((language) => language.toLowerCase());
  // Compare every language to the previous in the array. The first item is skipped, since there is
  // nothing to compare against.
  for (let i = 1; i < copy.length; i += 1) {
    // If the prevous language code is less specific than the current, swap them. Keep going back
    // until another language is found or the start of the array is found.
    for (let j = i; j > 0; j -= 1) {
      const current = copy[j];
      const previous = copy[j - 1];
      if (current.startsWith(`${previous}-`)) {
        [copy[j - 1], copy[j]] = [current, previous];
      }
    }
  }
  return copy;
}

/**
 * @param languages A list of languages supported by the application.
 * @param choices A list of languages preferred by the user in order of preference.
 * @returns The best match
 */
export function detectLocale(
  languages: readonly string[],
  choices: readonly string[],
): string | undefined {
  const supportedLocales = sortLocales(languages);
  const wantedLocales = sortLocales(choices);

  for (const wanted of wantedLocales) {
    for (const supported of supportedLocales) {
      if (wanted.startsWith(supported)) {
        return supported;
      }
    }
  }
}
