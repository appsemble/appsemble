import { type ReactNode } from 'react';

/**
 * The minimum required length of a character range to highlight
 */
const minRangeLength = 3;

// Remove two letter words, the word `the`, and whitespace
const normalizeRegex = /\b(\w{1,2}|the)\b|\s+/gi;

export function highlight(haystack: string, needle: string): ReactNode[] | undefined {
  const match: ReactNode[] = [];
  let start = 0;

  /**
   * The remaining haystack to search.
   */
  let remainingHaystack = haystack
    // Normalize accents. https://stackoverflow.com/a/37511463/1154610
    .normalize('NFD')
    // Make it lower case
    .toLowerCase();

  /**
   * The remaining needle to process.
   */
  let remainingNeedle = needle
    // Normalize accents. https://stackoverflow.com/a/37511463/1154610
    .normalize('NFD')
    // Make it lower case
    .toLowerCase()
    // Remove two letter words, the word `the`, and whitespace
    .replaceAll(normalizeRegex, '');

  while (remainingNeedle.length >= minRangeLength) {
    const index = remainingHaystack.indexOf(remainingNeedle.slice(0, minRangeLength));

    // There is no match for the needle in the haystack
    if (index === -1) {
      return;
    }

    if (match.length) {
      // Only start showing text starting from the first match.
      match.push(haystack.slice(start, start + index));
    } else {
      // But append unmatched characters from the first word.
      const before = haystack.slice(0, start + index);
      const spaceIndex = before.lastIndexOf(' ');
      if (spaceIndex !== -1) {
        match.push(haystack.slice(spaceIndex + 1, start + index));
      }
    }

    remainingHaystack = remainingHaystack.slice(index);

    /**
     * The matched slice of text. We track this in bulk, so we can reduce the number of DOM nodes
     * to create.
     */
    let slice = '';
    let sliceIndex = 0;
    do {
      // We remove the first character from both the remaining haystack and needle.
      remainingHaystack = remainingHaystack.slice(1);
      remainingNeedle = remainingNeedle.slice(1);

      // We use the original haystack to append to the slice, because it has the correct casing.
      slice += haystack.charAt(start + index + sliceIndex);
      sliceIndex += 1;
    } while (
      remainingNeedle.length &&
      remainingHaystack.length &&
      // Because we remove the first character above, we always need to check the first character.
      remainingNeedle.charCodeAt(0) === remainingHaystack.charCodeAt(0)
    );
    match.push(
      <strong className="has-text-primary" key={start}>
        {slice}
      </strong>,
    );

    start = haystack.length - remainingHaystack.length;
  }

  if (remainingHaystack) {
    match.push(haystack.slice(start, haystack.length));
  }

  return match;
}
