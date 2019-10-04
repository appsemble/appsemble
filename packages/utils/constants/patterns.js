/**
 * A pattern for matching a lower case hyphen separated string.
 */
// eslint-disable-next-line import/prefer-default-export
export const normalized = /^[a-z\d](((?!.*--)[a-z\d-])*[a-z\d])?$/;
