import { type BrowserOptions, type Breadcrumb, type ErrorEvent, init } from '@sentry/browser';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { setupSentry } from './sentry.js';

vi.mock('@sentry/browser', () => ({
  addBreadcrumb: vi.fn(),
  browserProfilingIntegration: vi.fn(() => 'browserProfilingIntegration'),
  browserTracingIntegration: vi.fn(() => 'browserTracingIntegration'),
  captureMessage: vi.fn(),
  init: vi.fn(),
  replayIntegration: vi.fn(() => 'replayIntegration'),
}));

describe('setupSentry', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should scrub sensitive data before sending events', () => {
    setupSentry('https://public@example.com/1', 'test');

    const options = vi.mocked(init).mock.calls[0]![0] as BrowserOptions;
    if (!options.beforeSend) {
      throw new Error('beforeSend was not configured');
    }

    const event = options.beforeSend(
      {
        breadcrumbs: [
          {
            data: { password: 'secret value', value: 'safe value' },
          },
        ],
        contexts: {
          appsembleAction: {
            input: { password: 'secret value', value: 'safe value' },
            nested: { sessionToken: 'session value' },
          },
        },
        extra: { secret: 'secret value', value: 'safe value' },
        request: {
          data: { token: 'token value', value: 'safe value' },
          headers: { authorization: 'Bearer token' },
        },
        tags: { actionType: 'dialog.ok', token: 'token value' },
        type: undefined,
      } as ErrorEvent,
      {},
    );

    expect(event).toMatchObject({
      breadcrumbs: [{ data: { password: '[Filtered]', value: 'safe value' } }],
      contexts: {
        appsembleAction: {
          input: { password: '[Filtered]', value: 'safe value' },
          nested: { sessionToken: '[Filtered]' },
        },
      },
      extra: { secret: '[Filtered]', value: 'safe value' },
      request: {
        data: { token: '[Filtered]', value: 'safe value' },
        headers: { authorization: '[Filtered]' },
      },
      tags: { actionType: 'dialog.ok', token: '[Filtered]' },
    });
  });

  it('should scrub sensitive breadcrumb data when breadcrumbs are added', () => {
    setupSentry('https://public@example.com/1', 'test');

    const options = vi.mocked(init).mock.calls[0]![0] as BrowserOptions;
    if (!options.beforeBreadcrumb) {
      throw new Error('beforeBreadcrumb was not configured');
    }

    const breadcrumb = options.beforeBreadcrumb({
      data: { password: 'secret value', value: 'safe value' },
    } as Breadcrumb);

    expect(breadcrumb).toStrictEqual({
      data: { password: '[Filtered]', value: 'safe value' },
    });
  });
});
