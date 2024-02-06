export class UserPropertiesError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UserPropertiesError';
    Error.captureStackTrace(this, UserPropertiesError);
  }
}
