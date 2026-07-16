import axios, { type AxiosRequestConfig } from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { createTestAction } from '../makeActions.js';
import { apiUrl } from '../settings.js';

let mock: MockAdapter;
let request: AxiosRequestConfig;

beforeEach(() => {
  mock = new MockAdapter(axios);
});

afterEach(() => {
  mock.restore();
});

describe('webhook', () => {
  it('should submit JSON payloads unchanged', async () => {
    mock.onPost(/.*/).reply((req) => {
      request = req;
      return [200, { ok: true }, {}];
    });

    const action = createTestAction({
      definition: { type: 'webhook', name: 'submit-form' },
    });

    const result = await action({ label: 'Example' });

    expect(request.url).toBe(`${apiUrl}/api/apps/42/webhooks/submit-form`);
    expect(request.data).toBe('{"label":"Example"}');
    expect(result).toStrictEqual({ ok: true });
  });

  it('should submit nested files as resource multipart form data', async () => {
    mock.onPost(/.*/).reply((req) => {
      request = req;
      return [200, { ok: true }, {}];
    });

    const attachment = new File(['attachment'], 'attachment.pdf', { type: 'application/pdf' });
    const image = new File(['image'], 'image.png', { type: 'image/png' });
    const action = createTestAction({
      definition: { type: 'webhook', name: 'submit-form' },
    });

    const result = await action({
      itemId: 123,
      metadata: {
        attachment,
        category: 'Example category',
        count: 10,
        image,
      },
    });

    const body = request.data as FormData;
    expect(body).toBeInstanceOf(FormData);
    expect(body.get('resource')).toBe(
      '{"itemId":123,"metadata":{"attachment":"0","category":"Example category","count":10,"image":"1"}}',
    );
    expect(body.getAll('assets')).toStrictEqual([attachment, image]);
    expect(result).toStrictEqual({ ok: true });
  });
});
