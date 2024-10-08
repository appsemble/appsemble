export class AppMemberPropertiesError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AppMemberPropertiesError';
    Error.captureStackTrace(this, AppMemberPropertiesError);
  }
}
