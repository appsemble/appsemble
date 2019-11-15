/**
 * A pattern for extracting a normalized string.
 */
export const partialNormalized = /([a-z\d](?:(?!.*--)[a-z\d-]*[a-z\d])?)/;

/**
 * A pattern for exactly matching a lower case hyphen separated string.
 */
export const normalized = new RegExp(`^${partialNormalized.source}$`);
