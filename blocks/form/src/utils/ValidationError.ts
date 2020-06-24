/**
 * Used for throwing known validation errors.
 */
export default class ValidationError extends Error {
  /**
   * @param {string} message The error message to show to the user.
   */
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}
