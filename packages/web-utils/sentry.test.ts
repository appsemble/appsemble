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

it('should discard requests aborted by navigating away', () => {
  const originalException = new AxiosError('canceled', AxiosError.ERR_CANCELED, config, {});

  expect(discardNetworkErrors(event, { originalException } as EventHint)).toBeNull();
});

// Actions rethrow their failure wrapped in an ActionError whose real cause is the axios error.
function actionError(cause: unknown, type = 'resource.query'): Error {
  const error = new Error(`An error occurred while running ${type}`, { cause });
  error.name = `ActionError(${type})`;
  return error;
}

it('should discard action errors wrapping a request that never reached the server', () => {
  const originalException = actionError(
    new AxiosError('Network Error', AxiosError.ERR_NETWORK, config, {}, undefined),
  );

  expect(discardNetworkErrors(event, { originalException } as EventHint)).toBeNull();
});

it('should discard the action error from a dialog the user closed', () => {
  const originalException = actionError(undefined, 'dialog');

  expect(discardNetworkErrors(event, { originalException } as EventHint)).toBeNull();
});

it('should report a non-dialog action error that rejected without a cause', () => {
  const originalException = actionError(undefined, 'resource.query');

  expect(discardNetworkErrors(event, { originalException } as EventHint)).toBe(event);
});

it('should report action errors wrapping a server response', () => {
  const originalException = actionError(
    new AxiosError('Request failed with status code 400', AxiosError.ERR_BAD_REQUEST, config, {}, {
      status: 400,
      data: {},
    } as AxiosResponse),
  );

  expect(discardNetworkErrors(event, { originalException } as EventHint)).toBe(event);
});
