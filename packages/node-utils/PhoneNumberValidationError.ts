export class PhoneNumberValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PhoneNumberValidationError';
    Error.captureStackTrace(this, PhoneNumberValidationError);
  }
}
