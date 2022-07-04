/**
 * Each week day of the first week in 1970 represented as a number.
 *
 * This can be used for localizing week days.
 */
export const weekdays = Array.from(
  { length: 7 },
  // The dawn of time was on a thursday
  (unused, index) => (index + 3) * 24 * 60 * 60 * 1000,
);

/**
 * A day of each month in the year 1970.
 *
 * This can be used for localizing month names.
 */
export const months = Array.from(
  { length: 12 },
  (unused, index) => index * 31 * 24 * 60 * 60 * 1000,
);
