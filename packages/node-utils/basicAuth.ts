/**
 * Create a basic auth authorization header from a username and password.
 *
 * @param username The username to serialize.
 * @param password The password to serialize.
 * @returns An HTTP basic auth authorization header.
 */
export function basicAuth(username: string, password: string): string {
  return `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`;
}
