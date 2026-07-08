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

  it('should submit top-level files as multipart form data', async () => {
    mock.onPost(/.*/).reply((req) => {
      request = req;
      return [200, { ok: true }, {}];
    });

    const pdf = new File(['attachment'], 'attachment.pdf', { type: 'application/pdf' });
    const xml = new File(['xml'], 'note.xml', { type: 'application/xml' });
    const action = createTestAction({
      definition: { type: 'webhook', name: 'submit-form' },
    });

    const result = await action({
      foo: 'Example',
      pdf,
      xml,
    });

    const body = request.data as FormData;
    expect(body).toBeInstanceOf(FormData);
    expect(body.get('foo')).toBe('Example');
    expect(body.get('pdf')).toBe(pdf);
    expect(body.get('xml')).toBe(xml);
    expect(result).toStrictEqual({ ok: true });
  });
});
