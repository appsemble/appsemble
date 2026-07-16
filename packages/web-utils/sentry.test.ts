import { type ErrorEvent, type EventHint } from '@sentry/browser';
import { AxiosError, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios';
import { expect, it } from 'vitest';

import { discardNetworkErrors } from './sentry.js';

const event = { transaction: '/nl/muzikant/10101' } as ErrorEvent;

const config = {
  url: 'https://appsemble.app/api/apps/129/resources/musician/10101',
} as InternalAxiosRequestConfig;

it('should discard axios errors which never reached the server', () => {
  const originalException = new AxiosError(
    'Network Error',
    AxiosError.ERR_NETWORK,
    config,
    {},
    undefined,
  );

  expect(discardNetworkErrors(event, { originalException } as EventHint)).toBeNull();
});

it('should report axios errors which received an HTTP response', () => {
  const originalException = new AxiosError(
    'Request failed with status code 500',
    AxiosError.ERR_BAD_RESPONSE,
    config,
    {},
    { status: 500, data: {} } as AxiosResponse,
  );

  expect(discardNetworkErrors(event, { originalException } as EventHint)).toBe(event);
});

it('should report axios errors caused by an invalid request', () => {
  const originalException = new AxiosError('Invalid URL', AxiosError.ERR_INVALID_URL, config, {});

  expect(discardNetworkErrors(event, { originalException } as EventHint)).toBe(event);
});

it('should report application errors', () => {
  const originalException = new TypeError('data.map is not a function');

  expect(discardNetworkErrors(event, { originalException } as EventHint)).toBe(event);
});
