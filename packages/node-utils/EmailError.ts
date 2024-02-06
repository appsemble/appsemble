export class EmailError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'EmailError';
    Error.captureStackTrace(this, EmailError);
  }
}
