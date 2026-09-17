import axios from 'axios';

/**
 * Check whether a request failed because a second authentication factor is still outstanding.
 *
 * The endpoints which issue app member tokens based on credentials reject the request when the app
 * requires TOTP. Callers which follow up with a regular login can safely ignore such a rejection,
 * because that login surfaces the TOTP challenge again.
 *
 * @param error The error thrown by the request.
 * @returns Whether TOTP verification is required.
 */
export function isTotpRequiredError(error: unknown): boolean {
  if (!axios.isAxiosError(error)) {
    return false;
  }
  const { data } = error.response ?? {};
  return error.response?.status === 401 && data?.data?.totpRequired === true;
}
