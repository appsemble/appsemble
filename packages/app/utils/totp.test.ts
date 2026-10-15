import { AxiosError, AxiosHeaders, type AxiosResponse } from 'axios';
import { describe, expect, it } from 'vitest';

import { getGrantTotpChallenge, getTotpChallenge } from './totp.js';

function createError(status: number, data: unknown): AxiosError {
  const config = { headers: new AxiosHeaders() };
  const response = {
    config,
    data,
    headers: {},
    status,
    statusText: '',
  } as AxiosResponse;
  return new AxiosError('Request failed', String(status), config as never, null, response);
}

describe('getGrantTotpChallenge', () => {
  it('should read the snake_case OAuth2 error body', () => {
    const error = createError(400, {
      error: 'totp_required',
      // eslint-disable-next-line @typescript-eslint/naming-convention
      totp_enabled: true,
      // eslint-disable-next-line @typescript-eslint/naming-convention
      totp_token: 'pending',
    });

    expect(getGrantTotpChallenge(error)).toStrictEqual({
      totpEnabled: true,
      totpToken: 'pending',
    });
  });

  it('should ignore other OAuth2 errors', () => {
    expect(getGrantTotpChallenge(createError(400, { error: 'invalid_client' }))).toBeUndefined();
  });

  it('should ignore errors which are not Axios errors', () => {
    expect(getGrantTotpChallenge(new Error('boom'))).toBeUndefined();
  });
});

describe('getTotpChallenge', () => {
  it('should read the Appsemble error body', () => {
    const error = createError(401, {
      error: 'Unauthorized',
      message: 'TOTP verification required',
      statusCode: 401,
      data: { totpRequired: true, totpEnabled: false, totpToken: 'pending' },
    });

    expect(getTotpChallenge(error)).toStrictEqual({
      totpEnabled: false,
      totpToken: 'pending',
    });
  });

  it('should ignore other unauthorized responses', () => {
    const error = createError(401, {
      error: 'Unauthorized',
      message: 'App member not found',
      statusCode: 401,
    });

    expect(getTotpChallenge(error)).toBeUndefined();
  });

  it('should ignore the snake_case grant body', () => {
    const error = createError(400, {
      error: 'totp_required',
      // eslint-disable-next-line @typescript-eslint/naming-convention
      totp_token: 'pending',
    });

    expect(getTotpChallenge(error)).toBeUndefined();
  });
});
