import axios, { type AxiosRequestConfig } from 'axios';
import MockAdapter from 'axios-mock-adapter';

import { createTestAction } from '../makeActions.js';
import { apiUrl } from '../settings.js';

describe('email', () => {
  let mock: MockAdapter;
  let request: AxiosRequestConfig;

  beforeEach(() => {
    mock = new MockAdapter(axios);
    mock.onPost(`${apiUrl}/api/apps/42/action/pages.0.blocks.0.actions.onClick`).reply((req) => {
      request = req;
      return [200, {}];
    });
  });

  afterEach(() => {
    mock.restore();
  });

  it('should call the action endpoint', async () => {
    const action = createTestAction({
      definition: { type: 'email', subject: [], body: [] },
      prefix: 'pages.test.blocks.0.actions.onClick',
      prefixIndex: 'pages.0.blocks.0.actions.onClick',
    });
    const result = await action({ to: 'user@example.com' });
    expect(request.data).toBe('{"to":"user@example.com"}');
    expect(result).toStrictEqual({ to: 'user@example.com' });
  });

  it('should submit an empty object if no action data is specified', async () => {
    const action = createTestAction({
      definition: { type: 'email', subject: [], body: [] },
      prefix: 'pages.test.blocks.0.actions.onClick',
      prefixIndex: 'pages.0.blocks.0.actions.onClick',
    });
    const result = await action();
    expect(request.data).toBe('{}');
    expect(result).toBeUndefined();
  });
});
