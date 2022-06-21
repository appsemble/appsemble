/**
 * The type of the SSL status.
 *
 * - `error` means there was an error getting an SSL certificate.
 * - `missing` means the domain name is unknown to the server.
 * - `pending` means the SSL certificate is still being processed.
 * - `ready` means the SSL certificate is ready to serve.
 * - `unknown` means the status is unknown, probably due to an unexpected state.
 */
export type SSLStatus = 'error' | 'missing' | 'pending' | 'ready' | 'unknown';

/**
 * A mapping of domain names to an SSL certificate status.
 */
export type SSLStatusMap = Record<string, SSLStatus>;
