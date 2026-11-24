/**
 * The code identifying a failed app definition validation in an error response.
 *
 * Error messages are prose and may be reworded at any time, so consumers match on this code
 * instead. It is sent as the `code` property of the error response data, next to the `errors`
 * array describing each validation error.
 */
export const APP_VALIDATION_FAILED = 'APP_VALIDATION_FAILED';

/**
 * The operation requires a recent sign-in to manage organization SSO.
 */
export const ORGANIZATION_SSO_REAUTHENTICATION_REQUIRED =
  'ORGANIZATION_SSO_REAUTHENTICATION_REQUIRED';
