export class EmailQuotaExceededError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'EmailQuotaExceededError';
    Error.captureStackTrace(this, EmailQuotaExceededError);
  }
}
