/**
 * The code identifying a failed app definition validation in an error response.
 *
 * Error messages are prose and may be reworded at any time, so consumers match on this code
 * instead. It is sent as the `code` property of the error response data, next to the `errors`
 * array describing each validation error.
 */
export const APP_VALIDATION_FAILED = 'APP_VALIDATION_FAILED';
