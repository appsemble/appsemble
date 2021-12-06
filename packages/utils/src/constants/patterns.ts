/**
 * A pattern for extracting a semver value.
 */
export const partialSemver = /\d+\.\d+\.\d+/;

/**
 * A pattern for validating a hexadecimal RGB color.
 */
export const hexColor = /^#[\dA-Fa-f]{6}$/;

/**
 * A pattern for matching a full semver.
 */
export const semver = new RegExp(`^${partialSemver.source}$`);

/**
 * A pattern for extracting a normalized string.
 */
export const partialNormalized = /([\da-z](?:(?!.*--)[\da-z-]*[\da-z])?)/;

/**
 * A pattern for exactly matching a lower case hyphen separated string.
 */
export const normalized = new RegExp(`^${partialNormalized.source}$`);

/**
 * A pattern for matching the block name pattern of @organization/block.
 */
export const blockNamePattern = new RegExp(
  `^@${partialNormalized.source}/${partialNormalized.source}$`,
);

export const domainPattern = new RegExp(`^(${partialNormalized.source}+\\.)+[a-z]{2,}$`);

/**
 * A pattern to match a Google Analytics ID or an empty string.
 */
export const googleAnalyticsIDPattern = /^(|UA-\d{4,10}-\d{1,4}|G-[\dA-Z]{4,})$/;

/**
 * A pattern which matches a UUID 4.
 */
export const uuid4Pattern = /^[\d[a-f]{8}-[\da-f]{4}-4[\da-f]{3}-[\da-f]{4}-[\d[a-f]{12}$/;

/**
 * A pattern which matches a JSON web token.
 */
export const jwtPattern = /^[\w-]+(?:\.[\w-]+){2}$/;
