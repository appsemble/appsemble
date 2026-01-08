import { type ActionDefinition } from '@appsemble/lang-sdk';
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { request } from './request.js';
import { App, Organization } from '../../models/index.js';
import { options } from '../../options/options.js';
import { handleAction } from '../action.js';
import { argv, setArgv } from '../argv.js';
import { Mailer } from '../email/Mailer.js';

let mailer: Mailer;
let mock: MockAdapter;

const exampleApp = (orgId: string, action: ActionDefinition, path = 'test-app'): Promise<App> =>
  App.create({
    OrganizationId: orgId,
    path,
    vapidPrivateKey: '',
    vapidPublicKey: '',
    definition: {
      name: 'Test App',
      defaultPage: '',
      pages: [],
      cron: {
        list: {
          schedule: '* * * * *',
          action,
        },
      },
    },
  } as Partial<App>);

describe('request action', () => {
  beforeAll(() => {
    vi.useFakeTimers();
  });

  beforeEach(async () => {
    vi.clearAllTimers();
    vi.setSystemTime(0);
    setArgv({ host: 'https://example.com' });
    mailer = new Mailer(argv);
    mock = new MockAdapter(axios);
    await Organization.create({ id: 'testorg' });
  });

  afterEach(() => {
    mock.restore();
  });

  afterAll(() => {
    vi.useRealTimers();
  });

  describe('basic request functionality', () => {
    it('should make a GET request', async () => {
      const action: ActionDefinition = {
        type: 'request',
        url: 'https://httpbin.org/get',
      };

      mock.onGet('https://httpbin.org/get').reply(200, { success: true });

      const app = await exampleApp('testorg', action);

      const result = await handleAction(request, {
        app,
        action,
        mailer,
        data: {},
        options,
        context: {} as any,
      });

      expect(result).toStrictEqual({ success: true });
    });

    it('should make a POST request', async () => {
      const action: ActionDefinition = {
        type: 'request',
        url: 'https://httpbin.org/post',
        method: 'POST',
      };

      mock.onPost('https://httpbin.org/post').reply(200, { received: true });

      const app = await exampleApp('testorg', action);

      const result = await handleAction(request, {
        app,
        action,
        mailer,
        data: { name: 'test' },
        options,
        context: {} as any,
      });

      expect(result).toStrictEqual({ received: true });
    });

    it('should make a PUT request', async () => {
      const action: ActionDefinition = {
        type: 'request',
        url: 'https://httpbin.org/put',
        method: 'PUT',
      };

      mock.onPut('https://httpbin.org/put').reply(200, { updated: true });

      const app = await exampleApp('testorg', action);

      const result = await handleAction(request, {
        app,
        action,
        mailer,
        data: { id: 1, name: 'updated' },
        options,
        context: {} as any,
      });

      expect(result).toStrictEqual({ updated: true });
    });

    it('should make a DELETE request', async () => {
      const action: ActionDefinition = {
        type: 'request',
        url: 'https://httpbin.org/delete',
        method: 'DELETE',
      };

      mock.onDelete('https://httpbin.org/delete').reply(200, { deleted: true });

      const app = await exampleApp('testorg', action);

      const result = await handleAction(request, {
        app,
        action,
        mailer,
        data: { id: 1 },
        options,
        context: {} as any,
      });

      expect(result).toStrictEqual({ deleted: true });
    });

    it('should make a PATCH request', async () => {
      const action: ActionDefinition = {
        type: 'request',
        url: 'https://httpbin.org/patch',
        method: 'PATCH',
      };

      mock.onPatch('https://httpbin.org/patch').reply(200, { patched: true });

      const app = await exampleApp('testorg', action);

      const result = await handleAction(request, {
        app,
        action,
        mailer,
        data: { id: 1, field: 'value' },
        options,
        context: {} as any,
      });

      expect(result).toStrictEqual({ patched: true });
    });
  });

  describe('response handling', () => {
    it('should parse JSON response', async () => {
      const action: ActionDefinition = {
        type: 'request',
        url: 'https://api.example.com/data',
      };

      mock
        .onGet('https://api.example.com/data')
        .reply(200, { items: [1, 2, 3], total: 3 }, { 'content-type': 'application/json' });

      const app = await exampleApp('testorg', action);

      const result = await handleAction(request, {
        app,
        action,
        mailer,
        data: {},
        options,
        context: {} as any,
      });

      expect(result).toStrictEqual({ items: [1, 2, 3], total: 3 });
    });

    it('should handle text response', async () => {
      const action: ActionDefinition = {
        type: 'request',
        url: 'https://api.example.com/text',
      };

      mock.onGet('https://api.example.com/text').reply(200, 'Hello, World!', {
        'content-type': 'text/plain',
      });

      const app = await exampleApp('testorg', action);

      const result = await handleAction(request, {
        app,
        action,
        mailer,
        data: {},
        options,
        context: {} as any,
      });

      expect(result).toBe('Hello, World!');
    });
  });

  // SSRF protection tests are in utils/actions/ssrf.test.ts
  // They require integration testing through the real Koa server because
  // axios-mock-adapter intercepts requests before HTTP agents can block them.

  describe('error handling', () => {
    it('should propagate non-SSRF errors', async () => {
      const action: ActionDefinition = {
        type: 'request',
        url: 'https://api.example.com/error',
      };

      mock.onGet('https://api.example.com/error').networkError();

      const app = await exampleApp('testorg', action);

      await expect(
        handleAction(request, {
          app,
          action,
          mailer,
          data: {},
          options,
          context: {} as any,
        }),
      ).rejects.toThrowError('Network Error');
    });
  });
});
