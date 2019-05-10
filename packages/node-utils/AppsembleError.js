/**
 * Used for throwing known Appsemble errors.
 *
 * This is used when the normal control flow needs to be aborted, but for reasons known. When an
 * instance of `AppsembleError` is thrown, the message will be logged, but not the stack trace.
 */
export default class AppsembleError extends Error {
  /**
   * @param {string} message The error message to show to the user.
   */
  constructor(message) {
    super(message);
    this.name = 'AppsembleError';
    Error.captureStackTrace(this, this.constructor);
  }
}
