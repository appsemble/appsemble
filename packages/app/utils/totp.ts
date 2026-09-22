import axios from 'axios';

/**
 * A challenge handed to the client when the first authentication factor checks out, but no session
 * may be created until a second factor has been verified.
 */
export interface TotpChallenge {
  /**
   * Whether the app member has already enrolled in TOTP, or still has to.
   */
  totpEnabled: boolean;

  /**
   * The pending TOTP token to pass to the TOTP endpoints.
   */
  totpToken: string;
}

/**
 * The OAuth2 token endpoint responds with an error following the OAuth2 error shape, which is why
 * this is the only place where the challenge is snake_case.
 */
interface GrantTotpChallengeResponse {
  error: 'totp_required';

  // eslint-disable-next-line @typescript-eslint/naming-convention
  totp_enabled: boolean;

  // eslint-disable-next-line @typescript-eslint/naming-convention
  totp_token: string;
}

/**
 * Every other endpoint responds with the standard Appsemble error body.
 */
interface TotpChallengeResponse {
  data?: {
    totpRequired?: boolean;
    totpEnabled?: boolean;
    totpToken?: string;
  };
}

/**
 * Get the TOTP challenge from a failed OAuth2 token request, if that’s why it failed.
 *
 * @param error The error thrown by the token request.
 * @returns The TOTP challenge, or undefined if the request failed for another reason.
 */
export function getGrantTotpChallenge(error: unknown): TotpChallenge | undefined {
  if (!axios.isAxiosError(error)) {
    return;
  }
  const data = error.response?.data as GrantTotpChallengeResponse | undefined;
  if (error.response?.status === 400 && data?.error === 'totp_required') {
    return { totpEnabled: data.totp_enabled ?? false, totpToken: data.totp_token };
  }
}

/**
 * Get the TOTP challenge from a failed request to a non OAuth2 endpoint, if that’s why it failed.
 *
 * @param error The error thrown by the request.
 * @returns The TOTP challenge, or undefined if the request failed for another reason.
 */
export function getTotpChallenge(error: unknown): TotpChallenge | undefined {
  if (!axios.isAxiosError(error)) {
    return;
  }
  const { data } = (error.response?.data ?? {}) as TotpChallengeResponse;
  if (error.response?.status === 401 && data?.totpRequired && data.totpToken) {
    return { totpEnabled: data.totpEnabled ?? false, totpToken: data.totpToken };
  }
}
